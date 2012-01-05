package Leeder;

use Dancer ':syntax';
use Digest::SHA1 qw/sha1_base64/;
use DBIx::Connector;
use XML::Feed;
use Encode;
use URI;
use common::sense;

our $VERSION = '0.1';

my $conn = DBIx::Connector->new('dbi:SQLite:dbname=feeds.db', '', '', {
  RaiseError => 1,
  AutoCommit => 1,
});

get '/' => sub {
  template 'index';
};

get '/api/feeds' => sub {
  my $dbh = $conn->dbh;

  my $sth = $dbh->prepare_cached("SELECT * FROM feed");
  $sth->execute;
  my $rows = $sth->fetchall_arrayref({});

  content_type "application/javascript; charset=utf-8";
  to_json $rows;
};

get '/api/feed/all' => sub {
  my $dbh = $conn->dbh;

  my $start = param("start") || 0;
  my $limit = param("items") || 25;

  $limit = 10 if $limit > 50;

  my $sth = $dbh->prepare_cached("SELECT * FROM entry ORDER BY issued,modified LIMIT ?,?");
  $sth->execute($start, $limit);
  my $rows = $sth->fetchall_arrayref({});

  content_type "application/javascript; charset=utf-8";
  to_json $rows;
};

get '/api/feed/:id' => sub {
  my $dbh = $conn->dbh;

  my $feed = param "id";
  die "id parameter is required" unless $feed =~ /^\d+$/;

  my $start = param("start")  || 0;
  my $limit = param("items")  || 25;

  $limit = 10 if $limit > 50;

  my $sth = $dbh->prepare_cached("SELECT * FROM entry WHERE feed_id=? ORDER BY issued,modified LIMIT ?,?");
  $sth->execute($feed, $start, $limit);
  my $rows = $sth->fetchall_arrayref({});

  content_type "application/javascript; charset=utf-8";
  to_json $rows;
};

del '/api/feed/:id' => sub {
  my $dbh = $conn->dbh;

  my $feed = param "id";
  die "id parameter is required" unless $feed =~ /^\d$/;

  $dbh->do("DELETE FROM feed WHERE id=?", {}, $feed);
  $dbh->do("DELETE FROM entry WHERE feed_id=?", {}, $feed);

  content_type "application/javascript";
  to_json {success => 1};
};

post '/api/feed' => sub {
  my $dbh = $conn->dbh;

  my $url = param("url");
  die "url parameter is requried" unless defined $url;
  
  my $feed = XML::Feed->parse(URI->new($url));

  my $feed_sth = $dbh->prepare_cached("INSERT INTO feed (name,url,subscribers) VALUES(?,?,1)");
  $feed_sth->execute($feed->title, $url);
  my $feed_id = $dbh->last_insert_id("", "", "", "");

  my @fields = qw/id feed_id content summary issued modified title link author/;

  my $columns = join ",", @fields;
  my $placeholders = join ",", map {"?"} @fields;

  local $dbh->{RaiseError} = 0;
  local $dbh->{PrintError} = 0;

  my $entry_sth = $dbh->prepare_cached("INSERT INTO entry ($columns) VALUES($placeholders)");

  for my $entry ($feed->entries) {
    my $hash = entry_to_hash($entry);

    my @bind = (
      $hash, $feed_id, $entry->content->body, $entry->summary->body,
      ($entry->issued ? $entry->issued->epoch : ""),
      ($entry->modified ? $entry->modified->epoch : ""),
    );

    # the rest are just properties
    push @bind, map {$entry->$_} @fields[6 .. $#fields];

    $entry_sth->execute(@bind);
  }

  content_type "application/javascript; charset=utf-8";
  to_json {name => $feed->title, id => $feed_id};
};

post '/api/entry/:id' => sub {
  my $dbh = $conn->dbh;

  my $read = param("read");
  die "read parameter is required" unless $read =~ /^0|1$/;

  $dbh->do("UPDATE entry SET read=?", {}, $read);

  content_type "application/javascript; charset=utf-8";
  to_json {success => 1};
};

sub entry_to_hash {
  my ($entry) = @_;
  my $x = sha1_base64
    encode 'utf-8',
      (my $a = join '/',
        $entry->title,
        ($entry->summary  ? $entry->summary->body : ''),
        ($entry->content  ? $entry->content->body : ''),
        $entry->id,
        $entry->link);
   $x;
}

1;
