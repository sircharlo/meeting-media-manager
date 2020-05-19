#! /bin/bash
# if [ "$TRAVIS_OS_NAME" == osx ]; then
#     # deploy on mac
#     yarn release
# else
#     # deploy on windows and linux
#     docker run --rm -e GH_TOKEN -v "${PWD}":/project -v ~/.cache/electron:/root/.cache/electron -v ~/.cache/electron-builder:/root/.cache/electron-builder electronuserland/builder:wine /bin/bash -c "yarn --link-duplicates --pure-lockfile && yarn release --linux AppImage --win"
# fi

if [ "$TRAVIS_OS_NAME" == "linux" ]; then
      docker run --rm \
        --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS|APPVEYOR_|CSC_|_TOKEN|_KEY|AWS_|STRIP|BUILD_') \
        -v ${PWD}:/project \
        -v ~/.cache/electron:/root/.cache/electron \
        -v ~/.cache/electron-builder:/root/.cache/electron-builder \
        electronuserland/builder \
        /bin/bash -c "yarn --link-duplicates --pure-lockfile && yarn release --linux"
    else
      yarn release
    fi
