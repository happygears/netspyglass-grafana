#!/usr/bin/env bash

TAR="tar"
case $(uname -s) in
    Linux)
        if test $(which bsdtar)
        then
            TAR="bsdtar"
        else
            echo "Can not find bsdtar, please install corresponding package"
            exit 1
        fi
        ;;
esac

test -d dist || {
    echo "Run this script at the top level of the directory tree"
    exit 1
}

# "-s" used like this is BSD tar option. GNU tar also has "-s" but it has different function
# Options "-c", "-f" and "--exclude" work the same way for BSD and GNU tar
#
${TAR} -cf netspyglass-datasource.tar -s '!^dist!netspyglass-datasource!' --exclude test  dist/*

