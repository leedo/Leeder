package Leeder::Poller;

use AnyEvent;
use AnyEvent::Log;
use AnyEvent::Feed;
use AnyEvent::DBI;
use common::sense;

sub new {
  my ($class, $dsn) = @_;
  bless {
    urls => {},
    dbi  => AnyEvent::DBI->new(@$dsn,
      PrintError => 0,
      sqlite_unicode => 1,
      exec_server => 1,
      on_error => sub { AE::log warn => $@ }
    ),
  }, $class;
}

sub run {
  my $self = shift;
  my $cv = AE::cv;
  AE::signal $_ => sub {$cv->send} for qw/QUIT INT/;
  $self->{t} = AE::timer 0, 60, sub {$self->update_urls};
  $cv->recv;
}

sub update_urls {
  my $self = shift;

  AE::log info => "updating URL list";

  $self->{dbi}->exec("SELECT id,url,subscribers,last_mod FROM feed", sub {
    my ($dbh, $rows, $rv) = @_;

    for my $row (@$rows) {
      my ($id, $url, $subs, $last_mod) = @$row;

      if (!exists $self->{urls}{$id} and $subs > 0) {
        AE::log info => "adding $id ($url)";

        $self->{urls}{$id} = AnyEvent::Feed->new(
          url      => $url,
          interval => 60 * 3,
          on_fetch => sub { $self->update_feed($id, @_) },
          last_mod => $last_mod,
        );
      }
      else {
        AE::log info => "removing $id";
        delete $self->{urls}{$id};
      }
    }
  });
}

sub update_feed {
  my ($self, $feed_id, $reader, $new, $feed, $error) = @_;

  if (defined $error) {
    AE::log warn => $error;
    return;
  }

  AE::log info => "got " . scalar(@$new) . " new entries for feed $feed_id"; 

  if ($reader->{last_mod}) {
    $self->{dbi}->exec(
      "UPDATE feed SET last_mod=? WHERE id=?",
      $reader->{last_mod}, $feed_id, sub {}
    );
  }

  for (@$new) {
    my ($hash, $entry) = @$_;
    $entry->id($hash);

    my @fields = qw/feed_id content summary id title link author issued modified/;

    my $columns = join ",", @fields;
    my $placeholders = join ",", map {"?"} @fields;

    my @bind = ($feed_id, $entry->content->body, $entry->summary->body);
    push @bind, map {$entry->$_} @fields[3 .. $#fields];

    $self->{dbi}->exec(
      "INSERT INTO entry ($columns) VALUES($placeholders)",
      @bind, sub {}
    );
  }
}

1;
