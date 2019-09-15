#!/bin/bash
if git tag $GIT_TAG -a -m "Using git-tag: $GIT_TAG" 2>/dev/null; then
git tag $GIT_TAG -a -m "Travis generated git-tag"
git push origin master && git push origin master --tags
ls -aR
 else echo Tag already exists!; fi