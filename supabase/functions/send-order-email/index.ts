import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TEST_EMAIL = 'mathieu.todeschini@icloud.com'

async function genererPDF(client: any, lignes: any[], totalHT: number, totalPaires: number): Promise<string> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595]) // A4 paysage
  const { width, height } = page.getSize()

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const date = new Date().toLocaleDateString('fr-FR')
  const numeroCommande = `CMD-${Date.now()}`

  const noir = rgb(0.1, 0.07, 0.035)
  const gris = rgb(0.608, 0.545, 0.478)
  const blanc = rgb(1, 1, 1)
  const beige = rgb(0.961, 0.937, 0.902)
  const beigeLight = rgb(0.984, 0.976, 0.965)

  // Collecter toutes les tailles présentes
  const toutesLesTailles = new Set<string>()
  lignes.forEach((l: any) => {
    Object.entries(l.qtys || {}).forEach(([t, v]) => {
      if (parseInt(v as string) > 0) toutesLesTailles.add(t)
    })
  })
  const taillesTriees = Array.from(toutesLesTailles).sort((a, b) => parseFloat(a) - parseFloat(b))

  // Calcul des largeurs de colonnes
  const marginL = 30
  const marginR = 30
  const colRef = 110
  const colColoris = 80
  const colPaires = 45
  const colTotal = 60
  const tailleWidth = Math.min(32, Math.floor((width - marginL - marginR - colRef - colColoris - colPaires - colTotal) / taillesTriees.length))
  const tableWidth = colRef + colColoris + (tailleWidth * taillesTriees.length) + colPaires + colTotal

  // ── HEADER ──
  page.drawRectangle({ x: 0, y: height - 65, width, height: 65, color: noir })
  page.drawText("La Maison de l'Espadrille", { x: marginL, y: height - 28, size: 16, font: fontBold, color: blanc })
  page.drawText('BON DE COMMANDE', { x: marginL, y: height - 46, size: 8, font: fontRegular, color: rgb(0.6, 0.6, 0.6) })
  page.drawText(numeroCommande, { x: width - 200, y: height - 28, size: 10, font: fontBold, color: blanc })
  page.drawText(`Date : ${date}`, { x: width - 200, y: height - 44, size: 9, font: fontRegular, color: rgb(0.6, 0.6, 0.6) })

  // ── INFOS CLIENT ──
  let y = height - 80
  page.drawRectangle({ x: marginL, y: y - 55, width: width - marginL - marginR, height: 60, color: beige })
  page.drawText('CLIENT', { x: marginL + 10, y: y - 12, size: 7, font: fontBold, color: gris })
  page.drawText(client.magasin || '', { x: marginL + 10, y: y - 24, size: 10, font: fontBold, color: noir })
  page.drawText(`${client.nom || ''}  ·  ${client.email || ''}`, { x: marginL + 10, y: y - 38, size: 8, font: fontRegular, color: gris })
  page.drawText(`Livraison : ${(client.adresse_livraison || '').substring(0, 55)}`, { x: marginL + 10, y: y - 50, size: 8, font: fontRegular, color: gris })

  // ── EN-TÊTE TABLEAU ──
  y = y - 72
  let x = marginL
  page.drawRectangle({ x, y: y - 16, width: tableWidth, height: 22, color: noir })

  page.drawText('RÉFÉRENCE', { x: x + 4, y: y - 10, size: 7, font: fontBold, color: blanc })
  x += colRef
  page.drawText('COLORIS', { x: x + 4, y: y - 10, size: 7, font: fontBold, color: blanc })
  x += colColoris

  taillesTriees.forEach(t => {
    page.drawText(t, { x: x + tailleWidth / 2 - 6, y: y - 10, size: 7, font: fontBold, color: blanc })
    x += tailleWidth
  })

  page.drawText('PAIRES', { x: x + 4, y: y - 10, size: 7, font: fontBold, color: blanc })
  x += colPaires
  page.drawText('TOTAL HT', { x: x + 4, y: y - 10, size: 7, font: fontBold, color: blanc })

  // ── LIGNES TABLEAU ──
  y = y - 34
  lignes.forEach((l: any, i: number) => {
    if (i % 2 === 0) {
      page.drawRectangle({ x: marginL, y: y - 5, width: tableWidth, height: 18, color: beigeLight })
    }

    const qty = Object.values(l.qtys || {}).reduce((a: number, b) => a + (parseInt(b as string) || 0), 0)
    const totalLigne = Number(l.total_ht || qty * l.prix).toFixed(2)

    let cx = marginL
    page.drawText((l.reference || '').substring(0, 16), { x: cx + 4, y, size: 8, font: fontBold, color: noir })
    cx += colRef
    page.drawText((l.coloris || '').substring(0, 10), { x: cx + 4, y, size: 8, font: fontRegular, color: noir })
    cx += colColoris

    taillesTriees.forEach(t => {
      const v = parseInt((l.qtys || {})[t] as string) || 0
      if (v > 0) {
        page.drawText(String(v), { x: cx + tailleWidth / 2 - 4, y, size: 9, font: fontBold, color: noir })
      } else {
        page.drawText('—', { x: cx + tailleWidth / 2 - 4, y, size: 8, font: fontRegular, color: rgb(0.8, 0.8, 0.8) })
      }
      cx += tailleWidth
    })

    page.drawText(String(qty), { x: cx + 8, y, size: 9, font: fontBold, color: noir })
    cx += colPaires
    page.drawText(`${totalLigne}`, { x: cx + 4, y, size: 8, font: fontRegular, color: noir })

    y -= 18
  })

  // ── SÉPARATEUR ──
  page.drawLine({ start: { x: marginL, y: y - 8 }, end: { x: marginL + tableWidth, y: y - 8 }, thickness: 0.5, color: rgb(0.85, 0.82, 0.78) })
  y -= 26

  // ── TOTAUX ──
  const totauxX = width - 220
  const totauxData = [
    { label: 'Total paires', value: String(totalPaires) },
    { label: 'Total HT', value: `${Number(totalHT).toFixed(2)} EUR` },
    { label: 'TVA 20%', value: `${(Number(totalHT) * 0.2).toFixed(2)} EUR` },
  ]
  totauxData.forEach(t => {
    page.drawText(t.label, { x: totauxX, y, size: 9, font: fontRegular, color: gris })
    page.drawText(t.value, { x: totauxX + 100, y, size: 9, font: fontBold, color: noir })
    y -= 16
  })
  y -= 4
  page.drawRectangle({ x: totauxX - 10, y: y - 6, width: 220, height: 22, color: noir })
  page.drawText('TOTAL TTC', { x: totauxX, y: y + 2, size: 10, font: fontBold, color: blanc })
  page.drawText(`${(Number(totalHT) * 1.2).toFixed(2)} EUR`, { x: totauxX + 100, y: y + 2, size: 10, font: fontBold, color: blanc })

  // ── CONDITIONS ──
  const condY = 45
  page.drawLine({ start: { x: marginL, y: condY + 14 }, end: { x: width - marginR, y: condY + 14 }, thickness: 0.5, color: rgb(0.88, 0.85, 0.82) })
  page.drawText('Franco de port à partir de 1 500 EUR HT  ·  Minimum : 10 paires  ·  Règlement à 30 jours fin de mois  ·  La validation sur l\'application vaut bon pour accord.', {
    x: marginL, y: condY, size: 7, font: fontRegular, color: gris
  })

  // ── FOOTER ──
  page.drawRectangle({ x: 0, y: 0, width, height: 25, color: beige })
  page.drawText(`La Maison de l'Espadrille  ·  ${numeroCommande}  ·  ${date}`, {
    x: marginL, y: 7, size: 7.5, font: fontRegular, color: gris
  })

  const pdfBytes = await pdfDoc.save()
  return btoa(String.fromCharCode(...pdfBytes))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { client, lignes, totalHT, totalPaires } = await req.json()
    const date = new Date().toLocaleDateString('fr-FR')

    const pdfBase64 = await genererPDF(client, lignes, totalHT, totalPaires)
    const nomFichier = `bon-commande-${(client.magasin || 'client').replace(/\s/g, '-')}-${date.replace(/\//g, '-')}.pdf`

    const htmlBody = (prenom: string, isCopy: boolean) => `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f5f0eb">
        <div style="background:#1A1209;padding:18px 24px">
          <p style="color:white;margin:0;font-size:16px;font-family:Georgia,serif">La Maison de l'Espadrille</p>
        </div>
        <div style="padding:20px 24px">
          <div style="background:white;border-radius:8px;padding:18px 20px">
            <p style="margin:0 0 10px;font-size:14px;font-weight:bold;color:#1A1209">
              ${isCopy ? 'Merci pour votre commande !' : 'Nouvelle commande reçue'}
            </p>
            <p style="margin:0 0 14px;font-size:12px;color:#555;line-height:1.6">
              ${isCopy
                ? `Bonjour <strong>${prenom}</strong>,<br>Nous avons bien reçu votre commande. Veuillez trouver ci-joint le bon de commande détaillé. Votre représentant la traitera dans les plus brefs délais.`
                : `<strong>${client.magasin}</strong> — ${client.nom} vient de passer une commande. Le bon de commande est en pièce jointe.`
              }
            </p>
            <table style="width:100%;border-collapse:collapse;border-radius:6px;overflow:hidden">
              <tr style="background:#f5f0eb">
                <td style="padding:8px 12px;font-size:10px;color:#9B8B7A;text-transform:uppercase;letter-spacing:1px;font-weight:bold">Paires</td>
                <td style="padding:8px 12px;font-size:10px;color:#9B8B7A;text-transform:uppercase;letter-spacing:1px;font-weight:bold">Total HT</td>
                <td style="padding:8px 12px;font-size:10px;color:#9B8B7A;text-transform:uppercase;letter-spacing:1px;font-weight:bold">Total TTC</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;font-size:14px;font-weight:bold;color:#1A1209">${totalPaires}</td>
                <td style="padding:8px 12px;font-size:14px;font-weight:bold;color:#1A1209">${Number(totalHT).toFixed(2)} €</td>
                <td style="padding:8px 12px;font-size:14px;font-weight:bold;color:#1A1209">${(Number(totalHT) * 1.2).toFixed(2)} €</td>
              </tr>
            </table>
          </div>
          <p style="margin:12px 0 0;font-size:11px;color:#9B8B7A;text-align:center">Bon de commande détaillé en pièce jointe.</p>
        </div>
      </div>
    `

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'LME Commandes <onboarding@resend.dev>',
        to: [TEST_EMAIL],
        subject: `Nouvelle commande — ${client.magasin} — ${totalPaires} paires — ${date}`,
        html: htmlBody('', false),
        attachments: [{ filename: nomFichier, content: pdfBase64 }]
      }),
    })

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'LME Commandes <onboarding@resend.dev>',
        to: [TEST_EMAIL],
        subject: `Confirmation de commande — La Maison de l'Espadrille`,
        html: htmlBody(client.nom || '', true),
        attachments: [{ filename: nomFichier, content: pdfBase64 }]
      }),
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})