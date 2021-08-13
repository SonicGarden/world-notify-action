# World Notify Action

WorldにコメントするGitHub Actions

## Usage:

```yaml
name: Release Notify

on:
  push:
    branches:
      - master

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: SonicGarden/world-notify-action@v1
        with:
          token: ${{ secrets.WORLD_NOTIFY_APP_TOKEN }}
          participationId: xxx,yyy
          groupId: zzz,www
          content: |
            @here xxx リリース
```
