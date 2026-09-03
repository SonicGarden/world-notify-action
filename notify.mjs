#!/usr/bin/env node

const ROOM_API_URL_BASE = 'https://www.sonicgarden.world/room_api/v1'
const GROUP_API_URL = 'https://www.sonicgarden.world/group_api/v1/entries'

/**
 * GitHub Actions のワークフローコマンドで使えない文字をエスケープする。
 * https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions
 */
function escapeData(value) {
  return String(value)
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
}

/** core.setFailed 相当 */
function setFailed(message) {
  process.stdout.write(`::error::${escapeData(message)}\n`)
  process.exitCode = 1
}

/** core.getInput 相当（composite の env から読む） */
function getInput(name, {required = false} = {}) {
  const value = (process.env[name] ?? '').trim()
  if (required && !value) {
    throw new Error(`Input required and not supplied: ${name}`)
  }
  return value
}

function splitIds(ids) {
  return ids
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0)
}

async function post(url, label, body, extraHeaders = {}) {
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...extraHeaders
      },
      body: JSON.stringify(body)
    })
  } catch (error) {
    // ネットワークエラー等。error には URL (= token) が含まれうるので使わない
    throw new Error(`${label}: request failed (${error.name ?? 'Error'})`)
  }

  if (!res.ok) {
    throw new Error(`${label}: HTTP ${res.status} ${res.statusText}`)
  }
}

async function run() {
  try {
    const token = getInput('WORLD_TOKEN')
    const participationIdInput = getInput('WORLD_PARTICIPATION_ID')
    const groupIdInput = getInput('WORLD_GROUP_ID')
    const groupTokenInput = getInput('WORLD_GROUP_TOKEN')
    if (!participationIdInput && !groupIdInput && !groupTokenInput) {
      throw new Error('participationId, groupId or groupToken must be set')
    }

    const participationIds = splitIds(participationIdInput)
    const groupIds = splitIds(groupIdInput)
    const groupTokens = splitIds(groupTokenInput)
    if ((participationIds.length > 0 || groupIds.length > 0) && !token) {
      throw new Error(
        'Input required and not supplied: token (participationId / groupId を指定する場合は必須)'
      )
    }

    const content = getInput('WORLD_CONTENT', {required: true})

    const query = `token=${encodeURIComponent(token)}`

    const tasks = [
      ...participationIds.map(participationId => {
        const id = encodeURIComponent(participationId)
        return post(
          `${ROOM_API_URL_BASE}/rooms/participations/${id}/comments?${query}`,
          `participation ${participationId}`,
          {comment: {content}}
        )
      }),
      ...groupIds.map(groupId => {
        const id = encodeURIComponent(groupId)
        return post(
          `${ROOM_API_URL_BASE}/groups/${id}/entries?${query}`,
          `group ${groupId}`,
          {entry: {content}}
        )
      }),
      // グループトークンは投稿先のグループを兼ねるため、URL には ID を含めない
      ...groupTokens.map((groupToken, index) =>
        post(
          GROUP_API_URL,
          `group token #${index + 1}`,
          {entry: {content}},
          {authorization: `Bearer ${groupToken}`}
        )
      )
    ]

    const results = await Promise.allSettled(tasks)
    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result =>
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason)
      )

    if (errors.length > 0) {
      throw new Error(
        `${errors.length} of ${results.length} notifications failed: ${errors.join('; ')}`
      )
    }
  } catch (error) {
    setFailed(error instanceof Error ? error.message : String(error))
  }
}

run()
