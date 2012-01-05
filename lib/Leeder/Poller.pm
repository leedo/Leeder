package Leeder::Poller;

use AnyEvent;
use AnyEvent::Log;
use AnyEvent::DBI;
use AnyEvent::Feed;
use common::sense;
use Encode;
use Digest::SHA1 qw/sha1_hex/;

sub new {
  my ($class, $dsn) = @_;
  bless {
    urls => {},
    dbi  => AnyEvent::DBI->new(@$dsn,
      PrintError => 0,
      exec_server => 1,
      on_error => sub { AE::log(warn => $@) if $_[3]}
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
      elsif ($subs <= 0) {
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

    my @fields = qw/id feed_id content summary issued modified title link author/;

    my $columns = join ",", @fields;
    my $placeholders = join ",", map {"?"} @fields;

    my @bind = (
      $hash, $feed_id, $entry->content->body, $entry->summary->body,
      ($entry->issued ? $entry->issued->epoch : ""),
      ($entry->modified ? $entry->modified->epoch : ""),
    );
    push @bind, map {$entry->$_} @fields[6 .. $#fields];

    $self->{dbi}->exec(
      "INSERT INTO entry ($columns) VALUES($placeholders)",
      @bind, sub {}
    );
  }
}

# monkey patch AE::Feed to use sha1_hex... bleh
*AnyEvent::Feed::_entry_to_hash = sub {
   my ($entry) = @_;
   my $x = sha1_hex
      encode 'utf-8',
         (my $a = join '/',
            $entry->title,
            ($entry->summary  ? $entry->summary->body : ''),
            ($entry->content  ? $entry->content->body : ''),
            $entry->id,
            $entry->link);
   $x
};

1;
