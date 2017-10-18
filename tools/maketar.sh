#!/usr/bin/env bash

if ! test -d dist
then
    echo "Run this script at the top level of the directory tree"
    exit 1
fi

if test $(which tar)
then
    # Check which flavor of tar does this system have: GNU tar or BSD tar.
    # Other flavors exist too but they are relatively rare. See
    #  http://unix.stackexchange.com/questions/101561/what-are-the-differences-between-bsdtar-and-gnu-tar
    #
    if $(tar --version | grep -qi gnu)
    then
        tar -cf netspyglass-datasource-v1.tar --transform=s/^dist/netspyglass-datasource/g --exclude test  dist/*
        exit
    fi

    if $(tar --version | grep -qi bsd)
    then
        # "-s" used like this is BSD tar option. GNU tar also has "-s" but it has different function.
        # This usage of "-s" option should probably work both with libarchive tar and "classic" BSD tar, but
        # I could not test with "classic" because I do not have access to a system with it.
        # Options "-c", "-f" and "--exclude" work the same way for BSD and GNU tar
        #
        tar -cf netspyglass-datasource-v1.tar -s '!^dist!netspyglass-datasource!' --exclude test  dist/*
        exit
    fi
fi

echo "Could not find tar on this system, can not build archive"
exit 1
