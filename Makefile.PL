use strict;
use warnings;
use ExtUtils::MakeMaker;

WriteMakefile(
    NAME                => 'Leeder',
    AUTHOR              => q{Lee Aylward <lee@laylward.com>},
    VERSION_FROM        => 'lib/Leeder.pm',
    ABSTRACT            => 'Feed aggregator and reader',
    ($ExtUtils::MakeMaker::VERSION >= 6.3002
      ? ('LICENSE'=> 'perl')
      : ()),
    PL_FILES            => {},
    PREREQ_PM => {
        'Test::More' => 0,
        'YAML'       => 0,
        'Dancer'     => 1.3091,
        'AnyEvent::Feed' => 0,
        'AnyEvent::DBI'  => 0,
        'DBD::SQLite'    => 0,
    },
    dist                => { COMPRESS => 'gzip -9f', SUFFIX => 'gz', },
    clean               => { FILES => 'Leeder-*' },
);
