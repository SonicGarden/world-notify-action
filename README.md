# World Notify Action

WorldにコメントするGitHub Actions

## Usage

### グループトークンで投稿する（推奨）

Worldのグループ設定画面で発行したグループトークンを使う方法です。
トークン自体が投稿先のグループを示すため、`groupId` の指定は不要です。

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
          groupToken: ${{ secrets.WORLD_GROUP_TOKEN }}
          content: |
            @here xxx リリース
```

### World token で投稿する（従来の方法）

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
| `token` | No | World token（`participationId` / `groupId` を指定する場合は必須） |
| `participationId` | No | Participation id（カンマ区切りで複数指定可） |
| `groupId` | No | Group id（カンマ区切りで複数指定可） |
| `groupToken` | No | Group token（カンマ区切りで複数指定可） |
| `content` | Yes | Comment content |

`participationId` `groupId` `groupToken` は少なくともいずれか1つの指定が必要です。
指定した通知先はすべて実行され、1件でも失敗するとジョブは失敗します。

## エンドポイント

| 指定した input | エンドポイント | 認証 |
| --- | --- | --- |
| `participationId` | `POST /room_api/v1/rooms/participations/:id/comments` | クエリパラメータの `token` |
| `groupId` | `POST /room_api/v1/groups/:id/entries` | クエリパラメータの `token` |
| `groupToken` | `POST /group_api/v1/entries` | `Authorization: Bearer <groupToken>` |

## Development

依存パッケージもビルドも不要です。実装は `notify.mjs` の1ファイルのみで、
Node.js 組み込みの `fetch` だけを使っています。
`notify.mjs` を編集してコミットすれば、そのまま動作します。
