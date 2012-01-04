use Test::More;

BEGIN { use_ok "Pinboard::Client" }

my $cl = Pinboard::Client->new(user => $ENV{PINBOARD_USER}, password => $ENV{PINBOARD_PASS});

$cl->save_bookmark("http://arstechnica.com/", "ars!");
$cl->remove_bookmark("http://arstechnica.com/");

done_testing;
