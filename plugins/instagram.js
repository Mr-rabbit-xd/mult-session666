import { Module } from '../lib/plugins.js'
import instaSave from './bin/instagram.js'

Module({
  command: 'insta',
  package: 'downloader',
  description: 'Download Instagram photo/video'
})(async (message, match) => {

  // Styled English error
  if (!match) {
    return message.send(`
╭───「 📸 Instagram 」───╮
│
│  ❌ Instagram URL required
│
╰───────────────╯
`.trim())
  }

  try {
    const d = await instaSave(match)
    if (!d) return message.send('❌ Download failed')

    const caption = `
╭───「 📸 Instagram 」───╮
│
│  ${d.description || ''}
│
╰───────────────╯

✦ 𝐏ᴏᴡᴇʀᴇᴅ 𝐁Y  𝐑ᴀʙʙɪᴛ Xᴍᴅ Mɪɴɪ
`.trim()

    if (d.MP4) {
      return message.send({ video: { url: d.MP4 }, caption })
    }

    if (d.JPEG) {
      return message.send({ image: { url: d.JPEG }, caption })
    }

    if (Array.isArray(d.media)) {
      for (const m of d.media) {
        await message.send(
          m.type === 'video'
            ? { video: { url: m.url }, caption }
            : { image: { url: m.url }, caption }
        )
      }
      return
    }

    return message.send('❌ Unsupported post type')

  } catch (e) {
    console.error(e)
    return message.send('⚠️ Error occurred')
  }
})
