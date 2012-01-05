use Test::More;

BEGIN { use_ok "Pinboard::Client" }

my $cl = Pinboard::Client->new;

$cl->save_bookmark("http://arstechnica.com/", "ars!");
$cl->remove_bookmark("http://arstechnica.com/");

done_testing;
