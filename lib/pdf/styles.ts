import { Font, StyleSheet } from "@react-pdf/renderer"

import type { LineStyle } from "@/types/review.types"

// Noto Sans JP フォント登録
// public/fonts/ に配置された .ttf ファイルを使用
try {
  Font.register({
    family: "NotoSansJP",
    fonts: [
      {
        src:
          typeof window !== "undefined" ? "/fonts/NotoSansJP-Regular.ttf" : "",
        fontWeight: "normal",
      },
      {
        src: typeof window !== "undefined" ? "/fonts/NotoSansJP-Bold.ttf" : "",
        fontWeight: "bold",
      },
    ],
  })
} catch {
  // フォントファイルが見つからない場合はスキップ
}

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 8,
    padding: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 8,
    color: "#666",
  },
  table: {
    display: "flex" as const,
    flexDirection: "column" as const,
    width: "100%",
  },
  tableRow: {
    flexDirection: "row" as const,
    minHeight: 20,
  },
  tableHeaderRow: {
    flexDirection: "row" as const,
    minHeight: 20,
    backgroundColor: "#f0f0f0",
  },
  tableCell: {
    flex: 1,
    padding: 3,
    fontSize: 7,
    textAlign: "center",
    justifyContent: "center",
  },
  tableCellHeader: {
    flex: 1,
    padding: 3,
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    justifyContent: "center",
  },
  headerCell: {
    width: 60,
    padding: 3,
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "left",
  },
  labelCell: {
    width: 60,
    padding: 3,
    fontSize: 7,
    textAlign: "left",
  },
  footer: {
    position: "absolute",
    bottom: 10,
    right: 20,
    fontSize: 7,
    color: "#999",
  },
})

// 罫線スタイルのPDF用マッピング
export function lineStyleToPdf(style: LineStyle): string {
  switch (style) {
    case "none":
      return "0"
    case "thin":
      return "0.5pt solid #000"
    case "thick":
      return "1.5pt solid #000"
    case "double":
      return "1pt solid #000"
    case "dotted":
      return "0.5pt dotted #000"
    default:
      return "0.5pt solid #000"
  }
}

export function lineStyleToBorderWidth(style: LineStyle): number {
  switch (style) {
    case "none":
      return 0
    case "thin":
      return 0.5
    case "thick":
      return 1.5
    case "double":
      return 1
    case "dotted":
      return 0.5
    default:
      return 0.5
  }
}
