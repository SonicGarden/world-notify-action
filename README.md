# World Notify Action

WorldにコメントするGitHub Actions

## Usage

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
      - uses: SonicGarden/world-notify-action@v2
        with:
          token: ${{ secrets.WORLD_NOTIFY_APP_TOKEN }}
          participationId: xxx,yyy
          groupId: zzz,www
          content: |
            @here xxx リリース
```

## Inputs

| Name | Required | Description |
| --- | --- | --- |
| `token` | Yes | World token |
| `participationId` | No | Participation id（カンマ区切りで複数指定可） |
| `groupId` | No | Group id（カンマ区切りで複数指定可） |
| `content` | Yes | Comment content |

`participationId` と `groupId` は少なくともどちらか一方の指定が必要です。
指定した通知先はすべて実行され、1件でも失敗するとジョブは失敗します。

## Development

依存パッケージもビルドも不要です。実装は `notify.mjs` の1ファイルのみで、
Node.js 組み込みの `fetch` だけを使っています。
`notify.mjs` を編集してコミットすれば、そのまま動作します。
