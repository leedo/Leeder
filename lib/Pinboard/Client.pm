package Pinboard::Client;

use URI;
use URI::QueryParam;
use LWP;

sub new {
  my ($class, %args) = @_;

  if ($ENV{PINBOARD_USER}) {
    $args{user} = $ENV{PINBOARD_USER};
  }
  if ($ENV{PINBOARD_PASSWORD}) {
    $args{password} = $ENV{PINBOARD_PASSWORD};
  }

  die "user required"     unless defined $args{user};
  die "password required" unless defined $args{password};

  $args{host} = 'api.pinboard.in' unless defined $args{host};
  $args{version} = 'v1'           unless defined $args{version};

  my $ua = LWP::UserAgent->new;
  $ua->credentials("$args{host}:443", "API", $args{user}, $args{password});

  bless {
    ua   => $ua,
    base => "https://$args{host}/$args{version}"
  }, $class;
}

sub request {
  my ($self, $method, $path, $form) = @_;

  my $uri = URI->new("$self->{base}/$path");
  $uri->query_form_hash($form);

  my $res = $self->{ua}->get($uri->as_string);

  unless ($res->is_success) {
    die "API request failed: " . $res->status_line;
  }

  return $res;
}

sub save_bookmark {
  my ($self, $url, $description) = @_;

  $self->request(POST => "posts/add", {
    url => $url,
    description => $description,
  });
}

sub remove_bookmark {
  my ($self, $url) = @_;

  $self->request(GET => "posts/delete", {url => $url});
}

1;
