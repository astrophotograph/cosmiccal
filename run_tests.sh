#!/bin/sh

export CI=true
npm build
npm test ${@}