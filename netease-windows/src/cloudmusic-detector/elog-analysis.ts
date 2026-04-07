import os from "node:os"
import { CLOUDMUSIC_ELOG_MATCHES } from "./constant.js"
import { type PlayingStatusType } from "./types.js"

export default class ElogAnalysis {
  public static getHeader(row: string) {
    const regex =
      /^\[(\d+):(\d+):(\d{4}\/\d{6}:\d+):([A-Z]+):([a-zA-Z0-9._-]+)\((\d+)\)\]\s+\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/

    const [origin, pid, tid, timestamp, type, src, lr, datetime] =
      row.match(regex) || []

    if (!origin) {
      return null
    }

    const [_, startupTime] = timestamp.split(":")

    const uptime = os.uptime() * 1000
    const currentTime = +Date.now()
    const bootTime = currentTime - uptime
    const realLogTime = +startupTime + bootTime

    return {
      pid,
      tid,
      timestamp: realLogTime,
      type,
      src,
      lr,
      datetime,
    }
  }

  public static getType(row: string): PlayingStatusType | null {
    for (const [key, { rule }] of Object.entries(CLOUDMUSIC_ELOG_MATCHES)) {
      if (rule(row)) {
        return key as PlayingStatusType
      }
    }

    return null
  }

  public static decode(dataArray: Uint8Array): string {
    const bytesArr = Array.from(dataArray)
    const decodedBytes: number[] = bytesArr.map((byte) => {
      const hexDigit = (Math.floor(byte / 16) ^ ((byte % 16) + 8)) % 16
      return (
        hexDigit * 16 + Math.floor(byte / 64) * 4 + (~Math.floor(byte / 16) & 3)
      )
    })

    let decodedBuffer = new Uint8Array(decodedBytes)

    while (decodedBuffer.length > 0) {
      try {
        return new TextDecoder("utf-8").decode(decodedBuffer)
      } catch (error) {
        if (error instanceof TypeError) {
          decodedBuffer = decodedBuffer.slice(1)
        } else {
          break
        }
      }
    }

    return ""
  }
}
