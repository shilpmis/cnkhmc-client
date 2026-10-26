import React from "react"

// ─── Code 39 Barcode Generator (Pure SVG) ────────────────────────────────────

const CODE39_PATTERNS: Record<string, string> = {
  "0": "000110100",
  "1": "100100001",
  "2": "001100001",
  "3": "101100000",
  "4": "000110001",
  "5": "100110000",
  "6": "001110000",
  "7": "000100101",
  "8": "100100100",
  "9": "001100100",
  A: "100001001",
  B: "001001001",
  C: "101001000",
  D: "000011001",
  E: "100011000",
  F: "001011000",
  G: "000001101",
  H: "100001100",
  I: "001001100",
  J: "000011100",
  K: "100000011",
  L: "001000011",
  M: "101000010",
  N: "000010011",
  O: "100010010",
  P: "001010010",
  Q: "000000111",
  R: "100000110",
  S: "001000110",
  T: "000010110",
  U: "110000001",
  V: "011000001",
  W: "111000000",
  X: "010010001",
  Y: "110010000",
  Z: "011010000",
  "-": "010000101",
  ".": "110000100",
  " ": "011000100",
  $: "010101000",
  "/": "010100010",
  "+": "010001010",
  "%": "000101010",
  "*": "010010100",
}

export function generateCode39Svg(text: string, height = 24, narrowWidth = 1, wideWidth = 2.5): string {
  const clean = `*${String(text || "").toUpperCase().replace(/[^0-9A-Z\-.$/+% ]/g, "")}*`
  let currentX = 0
  const rects: string[] = []

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS["-"]

    for (let j = 0; j < 9; j++) {
      const isBar = j % 2 === 0
      const isWide = pattern[j] === "1"
      const width = isWide ? wideWidth : narrowWidth

      if (isBar) {
        rects.push(`<rect x="${currentX}" y="0" width="${width}" height="${height}" fill="#000000" />`)
      }
      currentX += width
    }
    // Inter-character gap
    currentX += narrowWidth
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(currentX)}" height="${height}" viewBox="0 0 ${Math.ceil(currentX)} ${height}" style="display:block;margin:0 auto;">${rects.join("")}</svg>`
}

// ─── Indian Currency Number to Words ─────────────────────────────────────────

export function numberToWordsIndianFormatted(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined || amount === 0) {
    return "Zero Rupees and zero Paise Only"
  }

  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  const convertTwoDigits = (n: number): string => {
    if (n === 0) return ""
    if (n < 20) return units[n]
    const t = Math.floor(n / 10)
    const u = n % 10
    return (tens[t] + (u > 0 ? "-" + units[u] : "")).trim()
  }

  const convertThreeDigits = (n: number): string => {
    const h = Math.floor(n / 100)
    const rem = n % 100
    let res = ""
    if (h > 0) {
      res += units[h] + " Hundred"
      if (rem > 0) res += " "
    }
    if (rem > 0) {
      res += convertTwoDigits(rem)
    }
    return res.trim()
  }

  const integerPart = Math.floor(Math.abs(amount))
  const paisePart = Math.round((Math.abs(amount) - integerPart) * 100)

  const crore = Math.floor(integerPart / 10000000)
  const remCrore = integerPart % 10000000

  const lakh = Math.floor(remCrore / 100000)
  const remLakh = remCrore % 100000

  const thousand = Math.floor(remLakh / 1000)
  const remThousand = remLakh % 1000

  let words = ""
  if (crore > 0) words += convertTwoDigits(crore) + " Crore "
  if (lakh > 0) words += convertTwoDigits(lakh) + " Lakh "
  if (thousand > 0) words += convertTwoDigits(thousand) + " Thousand "
  if (remThousand > 0) words += convertThreeDigits(remThousand) + " "

  words = words.trim()
  if (!words) words = "Zero"

  let paiseWords = "zero"
  if (paisePart > 0) {
    paiseWords = convertTwoDigits(paisePart)
  }

  return `${words} and ${paiseWords} Paise Only`.replace(/\s+/g, " ")
}

// ─── Format Date to DD-MM-YYYY ──────────────────────────────────────────────

export function formatDateDDMMYYYY(dateInput?: string | Date | null): string {
  if (!dateInput) {
    const d = new Date()
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`
  }

  try {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) {
      // If it's already YYYY-MM-DD or DD/MM/YYYY
      const s = String(dateInput).trim()
      if (s.includes("-")) {
        const parts = s.split("-")
        if (parts.length === 3 && parts[0].length === 4) {
          return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`
        }
      }
      return s
    }
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`
  } catch {
    return String(dateInput)
  }
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface FeeItem {
  title: string
  amount: number | string
}

export interface CNKHMCReceiptOptions {
  studentName: string
  sid: string
  level: string
  receiptNo: string
  course: string
  academicYear: string
  term: string | number
  date: string
  feeItems: FeeItem[]
  totalAmount: number | string
  amountInWords?: string
  paymentMode: string
  bankName?: string
  transactionRef?: string
  chequeDate?: string
  paymentDate?: string
  remark?: string
  copyLabel?: string
  barcodeText1?: string
  barcodeText2?: string
  showBarcode?: boolean
  receiptCategory?: "college" | "hostel" | "tuition" | "mess" | "certificate"
  isHostel?: boolean
  hostelName?: string
  hostelPhone?: string
  isMess?: boolean
  messName?: string
  messPhone?: string
  barcodeText?: string
}

// ─── Render Single Hostel Fee Receipt Copy HTML ─────────────────────────────
// Exact reproduction of "13 & 14 FEE RECEIPT HOSTEL cnkothari.emli.in_core-emli_code_hostel_print_receipt.php.pdf"

export function renderSingleHostelReceiptHtml(options: CNKHMCReceiptOptions): string {
  const {
    studentName,
    sid,
    level,
    receiptNo,
    course,
    academicYear,
    term,
    date,
    feeItems,
    totalAmount,
    amountInWords,
    paymentMode,
    bankName,
    transactionRef,
    chequeDate,
    paymentDate,
    remark,
    copyLabel,
    barcodeText,
    barcodeText1,
    barcodeText2,
    showBarcode = false,
    hostelName = "Kantaba Girls Hostel",
    hostelPhone = "02626-221095",
  } = options

  const numAmount = typeof totalAmount === "number" ? totalAmount : parseFloat(String(totalAmount).replace(/,/g, "")) || 0
  const formattedTotal = Number(numAmount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const words = amountInWords || numberToWordsIndianFormatted(numAmount)
  const effectiveDate = formatDateDDMMYYYY(date)
  const effectivePaymentDate = paymentDate ? formatDateDDMMYYYY(paymentDate) : effectiveDate

  // Format fee items into 3 column-pairs across rows
  const safeItems =
    feeItems && feeItems.length > 0
      ? feeItems
      : [{ title: "HOSTEL FEE", amount: formattedTotal }]

  const rows: { title1: string; amt1: string; title2: string; amt2: string; title3: string; amt3: string }[] = []

  for (let i = 0; i < safeItems.length; i += 3) {
    const item1 = safeItems[i]
    const item2 = safeItems[i + 1]
    const item3 = safeItems[i + 2]

    rows.push({
      title1: item1?.title || "",
      amt1: item1
        ? Number(typeof item1.amount === "number" ? item1.amount : parseFloat(String(item1.amount).replace(/,/g, "")) || 0).toLocaleString(
          "en-IN",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )
        : "",
      title2: item2?.title || "",
      amt2: item2
        ? Number(typeof item2.amount === "number" ? item2.amount : parseFloat(String(item2.amount).replace(/,/g, "")) || 0).toLocaleString(
          "en-IN",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )
        : "",
      title3: item3?.title || "",
      amt3: item3
        ? Number(typeof item3.amount === "number" ? item3.amount : parseFloat(String(item3.amount).replace(/,/g, "")) || 0).toLocaleString(
          "en-IN",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )
        : "",
    })
  }

  // Construct barcode value matching reference PDF (*2776R943900200*)
  const cleanSidLast = sid ? String(sid).trim().slice(-9) : "943900200"
  const cleanReceipt = receiptNo ? String(receiptNo).trim() : "1434"
  const barcodeVal =
    barcodeText ||
    (barcodeText1 && barcodeText2
      ? `${barcodeText1}R${barcodeText2}`
      : `${cleanReceipt}R${cleanSidLast}`)
  const barcodeSvg = showBarcode ? generateCode39Svg(barcodeVal, 28, 1, 2.2) : ""

  // Payment transaction line matching the exact PDF syntax:
  // e.g. "By Cheque[ Bank: Cheque No.(date): UTR SDCBN25115594715 ] : 8,750.00"
  let paymentLine = ""
  const modeUpper = (paymentMode || "CHEQUE").toUpperCase()

  if (modeUpper.includes("CASH")) {
    paymentLine = `By Cash : ${formattedTotal}`
  } else if (modeUpper.includes("CHEQUE")) {
    const bankPart = bankName ? `${bankName} ` : ""
    const chequePart = transactionRef ? `${transactionRef}` : ""
    paymentLine = `By Cheque[ Bank: ${bankPart}Cheque No.(date): ${chequePart}${chequeDate ? ` (${formatDateDDMMYYYY(chequeDate)})` : ""} ] : ${formattedTotal}`
  } else if (
    modeUpper.includes("ONLINE") ||
    modeUpper.includes("NEFT") ||
    modeUpper.includes("RTGS") ||
    modeUpper.includes("UPI") ||
    modeUpper.includes("BANK TRANSFER")
  ) {
    const bankPart = bankName ? `${bankName} ` : ""
    const refPart = transactionRef ? `Ref No.(date): ${transactionRef}` : ""
    paymentLine = `By ${paymentMode}[ Bank: ${bankPart}${refPart} ] : ${formattedTotal}`
  } else {
    paymentLine = `By ${paymentMode} : ${formattedTotal}`
  }

  return `
    <div class="hostel-receipt-half" style="font-family: Arial, Helvetica, sans-serif; color: #000000; background: #ffffff; width: 100%; box-sizing: border-box; padding: 2px 0;">
      <!-- Outer Bordered Header Box -->
      <table style="width: 100%; border: 1px solid #000000; border-radius: 3px; border-collapse: collapse; margin-bottom: 3px; box-sizing: border-box;">
        <tr>
          <td style="width: 78px; vertical-align: middle; text-align: left; padding: 4px 6px;">
            <img src="/college-logo.jpeg" alt="Logo" style="width: 64px; height: 64px; object-fit: contain; display: block;" />
          </td>
          <td style="text-align: center; vertical-align: middle; padding: 4px 8px;">
            <div style="font-size: 24px; font-weight: bold; line-height: 1.15; color: #000000; letter-spacing: -0.2px;">
              ${hostelName}
            </div>
            <div style="font-size: 9.5px; margin-top: 3px; color: #000000; line-height: 1.25;">
              C.N.Kothari Homoeopathic College,Vilasini K. Desai Arogya Sankul, Near Vanchetna Kakrapar bypass
            </div>
            <div style="font-size: 9.5px; margin-top: 1px; color: #000000; line-height: 1.25;">
              Tadkuva,Dist-Tapi , Vyara (Gujarat) 394650 Phone : ${hostelPhone}
            </div>
          </td>
        </tr>
      </table>

      <!-- Sub Header: FEE RECEIPT -->
      <div style="font-size: 11px; font-weight: bold; margin: 3px 0 2px 0; color: #000000; letter-spacing: 0.3px;">
        FEE RECEIPT ${copyLabel ? `<span style="font-size: 9.5px; font-weight: normal; margin-left: 8px;">(${copyLabel})</span>` : ""}
      </div>

      <!-- Student Metadata Grid (4 columns x 2 rows) -->
      <table style="width: 100%; border: 1px solid #000000; border-collapse: collapse; font-size: 10px; line-height: 1.35; margin-bottom: 2px;">
        <tr>
          <td style="border: 1px solid #000000; padding: 2px 6px; width: 38%;">
            <span style="font-weight: normal;">Students' Name :</span> <strong>${studentName}</strong>
          </td>
          <td style="border: 1px solid #000000; padding: 2px 6px; width: 28%;">
            <span style="font-weight: normal;">SID :</span> <strong>${sid}</strong>
          </td>
          <td colspan="2" style="border: 1px solid #000000; padding: 2px 6px; width: 40%; white-space: nowrap;">
            <span style="font-weight: normal;">Reciept No :</span> <strong>${receiptNo}</strong>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid #000000; padding: 2px 6px;">
            <span style="font-weight: normal;">Course :</span> <strong>${course}</strong>
          </td>
          <td style="border: 1px solid #000000; padding: 2px 6px;">
            <span style="font-weight: normal;">Academic Year :</span> <strong>${academicYear}</strong>
          </td>
          <td style="border: 1px solid #000000; padding: 2px 6px;">
            <span style="font-weight: normal;">Term :</span> <strong>${term}</strong>
          </td>
          <td style="border: 1px solid #000000; padding: 2px 6px;">
            <span style="font-weight: normal;">Date :</span> <strong>${effectiveDate}</strong>
          </td>
        </tr>
      </table>

      <!-- Fee Breakdown Table (6 columns) -->
      <table style="width: 100%; border: 1px solid #000000; border-collapse: collapse; font-size: 10px; line-height: 1.3; margin-bottom: 2px;">
        <thead>
          <tr style="border-bottom: 1px solid #000000; background-color: #ffffff;">
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: left; width: 24%; font-weight: bold;">Fee Title</th>
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: right; width: 10%; font-weight: bold;">Amount</th>
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: left; width: 24%; font-weight: bold;">Fee Title</th>
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: right; width: 10%; font-weight: bold;">Amount</th>
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: left; width: 22%; font-weight: bold;">Fee Title</th>
            <th style="padding: 2.5px 6px; text-align: right; width: 10%; font-weight: bold;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows
      .map(
        (r) => `
            <tr>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px;">${r.title1}</td>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: right;">${r.amt1}</td>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px;">${r.title2}</td>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: right;">${r.amt2}</td>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px;">${r.title3}</td>
              <td style="padding: 2.5px 6px; text-align: right;">${r.amt3}</td>
            </tr>
          `
      )
      .join("")}
          <!-- Centered Total Fees Row inside table -->
          <tr style="border-top: 1px solid #000000;">
            <td colspan="6" style="padding: 2.5px 6px; text-align: center; font-weight: bold; font-size: 10.5px;">
              Total Fees : ${formattedTotal}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Right Boxed Total below table -->
      <div style="display: flex; justify-content: flex-end; margin-top: 2px; margin-bottom: 3px;">
        <div style="border: 1px solid #000000; padding: 2px 10px; font-weight: bold; font-size: 10.5px; text-align: right;">
          TOTAL : ${formattedTotal}
        </div>
      </div>

      <!-- Payment Section -->
      <div style="font-size: 10px; font-weight: bold; margin: 3px 0 2px 0;">PAYMENT</div>
      <table style="width: 100%; border: 1px solid #000000; border-collapse: collapse; font-size: 9.5px;">
        <tr>
          <!-- Authority's Sign. -->
          <td style="width: ${showBarcode ? "11%" : "15%"}; border-right: 1px solid #000000; vertical-align: middle; text-align: center; padding: 4px 2px; height: 58px;">
            <div style="font-size: 9.5px; line-height: 1.25; color: #000000;">
              Authority's<br/>Sign.
            </div>
          </td>

          ${showBarcode ? `
          <!-- Barcode Column with SVG & *Val* -->
          <td style="width: 32%; border-right: 1px solid #000000; vertical-align: middle; text-align: center; padding: 3px 6px;">
            ${barcodeSvg}
            <div style="font-size: 9px; font-weight: bold; font-family: monospace, sans-serif; letter-spacing: 0.5px; margin-top: 2px;">
              *${barcodeVal}*
            </div>
          </td>
          ` : ""}

          <!-- Words and Mode of Transaction -->
          <td style="width: ${showBarcode ? "45%" : "71%"}; border-right: 1px solid #000000; vertical-align: top; padding: 4px 8px; font-size: 9.5px; line-height: 1.35;">
            <div style="font-weight: bold; margin-bottom: 4px; color: #000000;">
              ${words}
            </div>
            <div style="color: #000000;">
              ${paymentLine}
            </div>
          </td>

          <!-- Remark Column -->
          <td style="width: ${showBarcode ? "12%" : "14%"}; vertical-align: top; padding: 0; font-size: 9px;">
            <div style="border-bottom: 1px solid #000000; padding: 2px 4px; font-weight: bold; text-align: left;">Remark</div>
            <div style="padding: 4px; text-align: center; font-size: 9.5px;">${remark || "-"}</div>
          </td>
        </tr>
      </table>
    </div>
  `
}

// ─── Render Dual Copy Hostel Page (Single A4 Page with Cut Line) ───────────

export function renderHostelPageHtml(options: CNKHMCReceiptOptions): string {
  const topCopy = renderSingleHostelReceiptHtml({ ...options, copyLabel: "" })
  const bottomCopy = renderSingleHostelReceiptHtml({ ...options, copyLabel: "" })

  return `
    <div class="cnkhmc-a4-page hostel-a4-page" style="width: 100%; max-width: 820px; margin: 0 auto; background: #ffffff; padding: 4px 8px; box-sizing: border-box;">
      <!-- Top Copy -->
      ${topCopy}

      <!-- Center Cut Line matching reference PDF -->
      <div style="border-top: 1px dashed #555555; margin: 12px 0; width: 100%; position: relative;">
        <span style="position: absolute; right: 0; top: -8px; background: #ffffff; padding: 0 6px; font-size: 8.5px; color: #888888;">&scissor; Cut Here</span>
      </div>

      <!-- Bottom Copy -->
      ${bottomCopy}
    </div>
  `
}

// ─── Render Single Mess Fee Receipt Copy HTML ───────────────────────────────

export function renderSingleMessReceiptHtml(options: CNKHMCReceiptOptions): string {
  const {
    studentName,
    sid,
    level,
    receiptNo,
    course,
    academicYear,
    term,
    date,
    feeItems,
    totalAmount,
    amountInWords,
    paymentMode,
    bankName,
    transactionRef,
    chequeDate,
    paymentDate,
    remark,
    copyLabel,
    messName = "Rama Harshad Mess",
    messPhone = "02626-221095",
  } = options

  const numAmount = typeof totalAmount === "number" ? totalAmount : parseFloat(String(totalAmount).replace(/,/g, "")) || 0
  const formattedTotal = Number(numAmount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const words = amountInWords || numberToWordsIndianFormatted(numAmount)
  const effectiveDate = formatDateDDMMYYYY(date)

  // Format fee items into 3 column-pairs across rows
  const safeItems =
    feeItems && feeItems.length > 0
      ? feeItems
      : [{ title: "MESS FEE", amount: formattedTotal }]

  const rows: { title1: string; amt1: string; title2: string; amt2: string; title3: string; amt3: string }[] = []

  for (let i = 0; i < safeItems.length; i += 3) {
    const item1 = safeItems[i]
    const item2 = safeItems[i + 1]
    const item3 = safeItems[i + 2]

    rows.push({
      title1: item1?.title || "",
      amt1: item1
        ? Number(typeof item1.amount === "number" ? item1.amount : parseFloat(String(item1.amount).replace(/,/g, "")) || 0).toLocaleString(
          "en-IN",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )
        : "",
      title2: item2?.title || "",
      amt2: item2
        ? Number(typeof item2.amount === "number" ? item2.amount : parseFloat(String(item2.amount).replace(/,/g, "")) || 0).toLocaleString(
          "en-IN",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )
        : "",
      title3: item3?.title || "",
      amt3: item3
        ? Number(typeof item3.amount === "number" ? item3.amount : parseFloat(String(item3.amount).replace(/,/g, "")) || 0).toLocaleString(
          "en-IN",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )
        : "",
    })
  }

  // Payment transaction line matching the exact syntax
  let paymentLine = ""
  const modeUpper = (paymentMode || "CHEQUE").toUpperCase()

  if (modeUpper.includes("CASH")) {
    paymentLine = `By Cash : ${formattedTotal}`
  } else if (modeUpper.includes("CHEQUE")) {
    const bankPart = bankName ? `${bankName} ` : ""
    const chequePart = transactionRef ? `${transactionRef}` : ""
    paymentLine = `By Cheque[ Bank: ${bankPart}Cheque No.(date): ${chequePart}${chequeDate ? ` (${formatDateDDMMYYYY(chequeDate)})` : ""} ] : ${formattedTotal}`
  } else if (
    modeUpper.includes("ONLINE") ||
    modeUpper.includes("NEFT") ||
    modeUpper.includes("RTGS") ||
    modeUpper.includes("UPI") ||
    modeUpper.includes("BANK TRANSFER")
  ) {
    const bankPart = bankName ? `${bankName} ` : ""
    const refPart = transactionRef ? `Ref No.(date): ${transactionRef}` : ""
    paymentLine = `By ${paymentMode}[ Bank: ${bankPart}${refPart} ] : ${formattedTotal}`
  } else {
    paymentLine = `By ${paymentMode} : ${formattedTotal}`
  }

  return `
    <div class="mess-receipt-half" style="font-family: Arial, Helvetica, sans-serif; color: #000000; background: #ffffff; width: 100%; box-sizing: border-box; padding: 2px 0;">
      <!-- Outer Bordered Header Box -->
      <table style="width: 100%; border: 1px solid #000000; border-radius: 3px; border-collapse: collapse; margin-bottom: 3px; box-sizing: border-box;">
        <tr>
          <td style="width: 78px; vertical-align: middle; text-align: left; padding: 4px 6px;">
            <img src="/college-logo.jpeg" alt="Logo" style="width: 64px; height: 64px; object-fit: contain; display: block;" />
          </td>
          <td style="text-align: center; vertical-align: middle; padding: 4px 8px;">
            <div style="font-size: 24px; font-weight: bold; line-height: 1.15; color: #000000; letter-spacing: -0.2px;">
              ${messName}
            </div>
            <div style="font-size: 9.5px; margin-top: 3px; color: #000000; line-height: 1.25;">
              C.N.Kothari Homoeopathic College,Vilasini K. Desai Arogya Sankul, Near Vanchetna Kakrapar bypass
            </div>
            <div style="font-size: 9.5px; margin-top: 1px; color: #000000; line-height: 1.25;">
              Tadkuva,Dist-Tapi , Vyara (Gujarat) 394650 Phone : ${messPhone}
            </div>
          </td>
        </tr>
      </table>

      <!-- Sub Header: MESS FEE RECEIPT -->
      <div style="font-size: 11px; font-weight: bold; margin: 3px 0 2px 0; color: #000000; letter-spacing: 0.3px;">
        MESS FEE RECEIPT ${copyLabel ? `<span style="font-size: 9.5px; font-weight: normal; margin-left: 8px;">(${copyLabel})</span>` : ""}
      </div>

      <!-- Student Metadata Grid (4 columns x 2 rows) -->
      <table style="width: 100%; border: 1px solid #000000; border-collapse: collapse; font-size: 10px; line-height: 1.35; margin-bottom: 2px;">
        <tr>
          <td style="border: 1px solid #000000; padding: 2px 6px; width: 38%;">
            <span style="font-weight: normal;">Students' Name :</span> <strong>${studentName}</strong>
          </td>
          <td style="border: 1px solid #000000; padding: 2px 6px; width: 28%;">
            <span style="font-weight: normal;">SID :</span> <strong>${sid}</strong>
          </td>
          <td colspan="2" style="border: 1px solid #000000; padding: 2px 6px; width: 40%; white-space: nowrap;">
            <span style="font-weight: normal;">Reciept No :</span> <strong>${receiptNo}</strong>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid #000000; padding: 2px 6px;">
            <span style="font-weight: normal;">Course :</span> <strong>${course}</strong>
          </td>
          <td style="border: 1px solid #000000; padding: 2px 6px;">
            <span style="font-weight: normal;">Academic Year :</span> <strong>${academicYear}</strong>
          </td>
          <td style="border: 1px solid #000000; padding: 2px 6px;">
            <span style="font-weight: normal;">Term :</span> <strong>${term}</strong>
          </td>
          <td style="border: 1px solid #000000; padding: 2px 6px;">
            <span style="font-weight: normal;">Date :</span> <strong>${effectiveDate}</strong>
          </td>
        </tr>
      </table>

      <!-- Fee Breakdown Table (6 columns) -->
      <table style="width: 100%; border: 1px solid #000000; border-collapse: collapse; font-size: 10px; line-height: 1.3; margin-bottom: 2px;">
        <thead>
          <tr style="border-bottom: 1px solid #000000; background-color: #ffffff;">
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: left; width: 24%; font-weight: bold;">Fee Title</th>
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: right; width: 10%; font-weight: bold;">Amount</th>
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: left; width: 24%; font-weight: bold;">Fee Title</th>
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: right; width: 10%; font-weight: bold;">Amount</th>
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: left; width: 22%; font-weight: bold;">Fee Title</th>
            <th style="padding: 2.5px 6px; text-align: right; width: 10%; font-weight: bold;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows
      .map(
        (r) => `
            <tr>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px;">${r.title1}</td>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: right;">${r.amt1}</td>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px;">${r.title2}</td>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: right;">${r.amt2}</td>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px;">${r.title3}</td>
              <td style="padding: 2.5px 6px; text-align: right;">${r.amt3}</td>
            </tr>
          `
      )
      .join("")}
          <!-- Centered Total Fees Row inside table -->
          <tr style="border-top: 1px solid #000000;">
            <td colspan="6" style="padding: 2.5px 6px; text-align: center; font-weight: bold; font-size: 10.5px;">
              Total Fees : ${formattedTotal}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Right Boxed Total below table -->
      <div style="display: flex; justify-content: flex-end; margin-top: 2px; margin-bottom: 3px;">
        <div style="border: 1px solid #000000; padding: 2px 10px; font-weight: bold; font-size: 10.5px; text-align: right;">
          TOTAL : ${formattedTotal}
        </div>
      </div>

      <!-- Payment Section (Clean layout without barcode) -->
      <div style="font-size: 10px; font-weight: bold; margin: 3px 0 2px 0;">PAYMENT</div>
      <table style="width: 100%; border: 1px solid #000000; border-collapse: collapse; font-size: 9.5px;">
        <tr>
          <!-- Authority's Sign. -->
          <td style="width: 15%; border-right: 1px solid #000000; vertical-align: middle; text-align: center; padding: 4px 2px; height: 58px;">
            <div style="font-size: 9.5px; line-height: 1.25; color: #000000;">
              Authority's<br/>Sign.
            </div>
          </td>

          <!-- Words and Mode of Transaction -->
          <td style="width: 71%; border-right: 1px solid #000000; vertical-align: top; padding: 4px 8px; font-size: 9.5px; line-height: 1.35;">
            <div style="font-weight: bold; margin-bottom: 4px; color: #000000;">
              ${words}
            </div>
            <div style="color: #000000;">
              ${paymentLine}
            </div>
          </td>

          <!-- Remark Column -->
          <td style="width: 14%; vertical-align: top; padding: 0; font-size: 9px;">
            <div style="border-bottom: 1px solid #000000; padding: 2px 4px; font-weight: bold; text-align: left;">Remark</div>
            <div style="padding: 4px; text-align: center; font-size: 9.5px;">${remark || "-"}</div>
          </td>
        </tr>
      </table>
    </div>
  `
}

// ─── Render Dual Copy Mess Page (Single A4 Page with Cut Line) ─────────────

export function renderMessPageHtml(options: CNKHMCReceiptOptions): string {
  const topCopy = renderSingleMessReceiptHtml({ ...options, copyLabel: "" })
  const bottomCopy = renderSingleMessReceiptHtml({ ...options, copyLabel: "" })

  return `
    <div class="cnkhmc-a4-page mess-a4-page" style="width: 100%; max-width: 820px; margin: 0 auto; background: #ffffff; padding: 4px 8px; box-sizing: border-box;">
      <!-- Top Copy -->
      ${topCopy}

      <!-- Center Cut Line matching reference PDF -->
      <div style="border-top: 1px dashed #555555; margin: 12px 0; width: 100%; position: relative;">
        <span style="position: absolute; right: 0; top: -8px; background: #ffffff; padding: 0 6px; font-size: 8.5px; color: #888888;">&scissor; Cut Here</span>
      </div>

      <!-- Bottom Copy -->
      ${bottomCopy}
    </div>
  `
}

// ─── Render Single College Copy HTML ────────────────────────────────────────

export function renderSingleReceiptHtml(options: CNKHMCReceiptOptions): string {
  if (options.isMess || options.receiptCategory === "mess") {
    return renderSingleMessReceiptHtml(options)
  }

  if (options.isHostel || options.receiptCategory === "hostel") {
    return renderSingleHostelReceiptHtml(options)
  }

  const {
    studentName,
    sid,
    level,
    receiptNo,
    course,
    academicYear,
    term,
    date,
    feeItems,
    totalAmount,
    amountInWords,
    paymentMode,
    bankName,
    transactionRef,
    chequeDate,
    paymentDate,
    remark,
    copyLabel,
    barcodeText1,
    barcodeText2,
    showBarcode = false,
  } = options

  const numAmount = typeof totalAmount === "number" ? totalAmount : parseFloat(String(totalAmount).replace(/,/g, "")) || 0
  const formattedTotal = Number(numAmount).toLocaleString("en-IN")
  const words = amountInWords || numberToWordsIndianFormatted(numAmount)
  const effectiveDate = formatDateDDMMYYYY(date)
  const effectivePaymentDate = paymentDate ? formatDateDDMMYYYY(paymentDate) : effectiveDate

  // Format fee items into 3 column-pairs across rows
  const safeItems = feeItems && feeItems.length > 0 ? feeItems : [{ title: "TUTION FEE-M/G", amount: formattedTotal }]
  const rows: { title1: string; amt1: string; title2: string; amt2: string; title3: string; amt3: string }[] = []

  for (let i = 0; i < safeItems.length; i += 3) {
    const item1 = safeItems[i]
    const item2 = safeItems[i + 1]
    const item3 = safeItems[i + 2]

    rows.push({
      title1: item1?.title || "",
      amt1: item1 ? Number(item1.amount).toLocaleString("en-IN") : "",
      title2: item2?.title || "",
      amt2: item2 ? Number(item2.amount).toLocaleString("en-IN") : "",
      title3: item3?.title || "",
      amt3: item3 ? Number(item3.amount).toLocaleString("en-IN") : "",
    })
  }

  // Barcodes
  const bc1Value = barcodeText1 || receiptNo || "017521"
  const bc2Value = barcodeText2 || sid || "943900200"
  const bc1Svg = generateCode39Svg(bc1Value, 20, 1, 2.2)
  const bc2Svg = generateCode39Svg(bc2Value, 20, 1, 2.2)

  // Payment Mode of transaction string
  let modeString = ""
  const modeUpper = (paymentMode || "CASH").toUpperCase()
  if (modeUpper.includes("CASH")) {
    modeString = `By Cash : INR`
  } else if (modeUpper.includes("CHEQUE") || modeUpper.includes("DD")) {
    modeString = `By Cheque/DD (Bank : ${bankName || ""})[ Details:${transactionRef || ""}, Dt.${chequeDate ? formatDateDDMMYYYY(chequeDate) : effectivePaymentDate}.] : INR`
  } else {
    // NEFT / RTGS / UPI / Online
    modeString = `By ${paymentMode || "NEFT/RTGS"} (Bank : ${bankName || ""})[ Details:${transactionRef || "N/A"}, Dt.${effectivePaymentDate}.] : INR`
  }

  return `
    <div class="receipt-half" style="font-family: Arial, Helvetica, sans-serif; color: #000000; background: #ffffff; width: 100%; box-sizing: border-box; padding: 2px 0;">
      <!-- Header -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
        <tr>
          <td style="width: 82px; vertical-align: middle; text-align: left; padding-right: 8px;">
            <img src="/college-logo.jpeg" alt="CNKHMC Logo" style="width: 72px; height: auto; display: block;" />
          </td>
          <td style="text-align: center; vertical-align: middle;">
            <div style="font-size: 20px; font-weight: bold; line-height: 1.15; color: #000000; letter-spacing: -0.2px;">
              C. N. Kothari Homoeopathic Medical<br/>College & Research Center, Vyara
            </div>
            <div style="font-size: 10.5px; margin-top: 3px; color: #000000; line-height: 1.2;">
              Vilasini K. Desai Arogya Sankul, Near Vanchetna Kakrapar bypass Tadkuva,Dist-Tapi Gujarat 394650
            </div>
            <div style="font-size: 10px; margin-top: 2px; color: #000000; line-height: 1.2;">
              URL: www.cnkotharihomeocollege.org e-mail: cnkothricollege@gmail.com Telephone: -02626-224651
            </div>
            <div style="font-size: 11px; font-weight: bold; margin-top: 3px; letter-spacing: 0.5px; text-transform: uppercase;">
              FEE RECEIPT ${copyLabel ? `<span style="font-size:9.5px; font-weight:normal; text-transform:none; margin-left: 8px;">(${copyLabel})</span>` : ""}
            </div>
          </td>
        </tr>
      </table>

      <!-- Student Meta Grid -->
      <table style="width: 100%; border: 1px solid #000000; border-collapse: collapse; font-size: 10.5px; line-height: 1.35; margin-bottom: -1px;">
        <tr>
          <td style="border: 1px solid #000000; padding: 2px 6px; width: 36%;">
            <span style="font-weight: normal;">Student Name :</span> <strong>${studentName}</strong>
          </td>
          <td style="border: 1px solid #000000; padding: 2px 6px; width: 26%;">
            <span style="font-weight: normal;">SID :</span> <strong>${sid}</strong>
          </td>
          <td colspan="2" style="border: 1px solid #000000; padding: 2px 6px; width: 40%; white-space: nowrap;">
            <span style="font-weight: normal;">Receipt No :</span> <strong>${receiptNo}</strong>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid #000000; padding: 2px 6px;">
            <span style="font-weight: normal;">Course :</span> <strong>${course}</strong>
          </td>
          <td style="border: 1px solid #000000; padding: 2px 6px;">
            <span style="font-weight: normal;">Academic Year :</span> <strong>${academicYear}</strong>
          </td>
          <td style="border: 1px solid #000000; padding: 2px 6px;">
            <span style="font-weight: normal;">Term :</span> <strong>${term}</strong>
          </td>
          <td style="border: 1px solid #000000; padding: 2px 6px;">
            <span style="font-weight: normal;">Date :</span> <strong>${effectiveDate}</strong>
          </td>
        </tr>
      </table>

      <!-- Fee Breakdown Table (6 columns) -->
      <table style="width: 100%; border: 1px solid #000000; border-collapse: collapse; font-size: 10.5px; line-height: 1.3; margin-bottom: -1px;">
        <thead>
          <tr style="border-bottom: 1px solid #000000; background-color: #fafafa;">
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: left; width: 24%; font-weight: bold;">Fee Title</th>
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: right; width: 10%; font-weight: bold;">Amount</th>
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: left; width: 24%; font-weight: bold;">Fee Title</th>
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: right; width: 10%; font-weight: bold;">Amount</th>
            <th style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: left; width: 22%; font-weight: bold;">Fee Title</th>
            <th style="padding: 2.5px 6px; text-align: right; width: 10%; font-weight: bold;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows
      .map(
        (r) => `
            <tr>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px;">${r.title1}</td>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: right;">${r.amt1}</td>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px;">${r.title2}</td>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px; text-align: right;">${r.amt2}</td>
              <td style="border-right: 1px solid #000000; padding: 2.5px 6px;">${r.title3}</td>
              <td style="padding: 2.5px 6px; text-align: right;">${r.amt3}</td>
            </tr>
          `
      )
      .join("")}
          <!-- Center Total Row -->
          <tr style="border-top: 1px solid #000000;">
            <td colspan="6" style="padding: 2.5px 6px; text-align: center; font-weight: bold; font-size: 11px;">
              Total : ${formattedTotal}
            </td>
          </tr>
          <!-- Right Grand Total Row -->
          <tr style="border-top: 1px solid #000000;">
            <td colspan="6" style="padding: 2.5px 6px; text-align: right; font-weight: bold; font-size: 11px;">
              Total : ${formattedTotal}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Payment Section -->
      <div style="border: 1px solid #000000; position: relative; font-size: 10.5px;">
        <div style="position: absolute; top: 0; left: 0; font-size: 9px; font-weight: bold; padding: 0 4px; background: #ffffff;">
          Payment
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <tr>
            <!-- Authorised Signature Box -->
            <td style="width: ${showBarcode ? "16%" : "18%"}; border-right: 1px solid #000000; vertical-align: bottom; padding: 4px 6px; height: 68px;">
              <div style="font-size: 9.5px; line-height: 1.15; color: #000000;">
                Authorised<br/>Signature.
              </div>
            </td>

            ${showBarcode ? `
            <!-- Barcode & Codes Box -->
            <td style="width: 30%; border-right: 1px solid #000000; text-align: center; vertical-align: middle; padding: 3px 6px;">
              <div style="margin-bottom: 1px;">
                ${bc1Svg}
                <div style="font-size: 9.5px; font-weight: bold; letter-spacing: 0.5px; margin-top: 1px;">*${bc1Value}*</div>
              </div>
              <div style="margin-top: 2px;">
                ${bc2Svg}
                <div style="font-size: 9.5px; font-weight: bold; letter-spacing: 0.5px; margin-top: 1px;">*${bc2Value}*</div>
              </div>
            </td>
            ` : ""}

            <!-- Amount in words & Transaction Details -->
            <td style="width: ${showBarcode ? "44%" : "70%"}; border-right: 1px solid #000000; vertical-align: top; padding: 5px 10px; font-size: 10px; line-height: 1.35;">
              <div style="font-weight: bold; margin-bottom: 4px; color: #000000;">
                ${words}
              </div>
              <div style="color: #000000;">
                ${modeString}
              </div>
            </td>

            <!-- Remark Box -->
            <td style="width: ${showBarcode ? "10%" : "12%"}; vertical-align: top; padding: 3px 6px; font-size: 9.5px;">
              <div style="font-weight: bold; border-bottom: 1px solid #000000; padding-bottom: 1px; margin-bottom: 3px;">Remark</div>
              <div>${remark || "-"}</div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `
}

// ─── Render Dual Copy Page (Exact Form matching reference PDF) ──────────────

export function renderCNKHMCPageHtml(options: CNKHMCReceiptOptions): string {
  if (options.isMess || options.receiptCategory === "mess") {
    return renderMessPageHtml(options)
  }

  if (options.isHostel || options.receiptCategory === "hostel") {
    return renderHostelPageHtml(options)
  }

  const topCopy = renderSingleReceiptHtml({ ...options, copyLabel: "" })
  const bottomCopy = renderSingleReceiptHtml({ ...options, copyLabel: "" })

  return `
    <div class="cnkhmc-a4-page" style="width: 100%; max-width: 820px; margin: 0 auto; background: #ffffff; padding: 4px 8px; box-sizing: border-box;">
      <!-- Top Copy (College / Office) -->
      ${topCopy}

      <!-- Cut Line -->
      <div style="border-top: 1px dashed #555555; margin: 14px 0; width: 100%; position: relative;">
        <span style="position: absolute; right: 0; top: -8px; background: #fff; padding: 0 6px; font-size: 8.5px; color: #888;">&scissor; Cut Here</span>
      </div>

      <!-- Bottom Copy (Student Copy) -->
      ${bottomCopy}
    </div>
  `
}

// ─── React Preview Component ────────────────────────────────────────────────

export const CNKHMCReceiptPreview: React.FC<{ options: CNKHMCReceiptOptions }> = ({ options }) => {
  const html = React.useMemo(() => renderCNKHMCPageHtml(options), [options])

  return (
    <div
      className="receipt-preview-wrapper bg-white shadow-md rounded-md p-4 overflow-auto border border-slate-300"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
