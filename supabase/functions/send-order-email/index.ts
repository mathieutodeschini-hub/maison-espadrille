import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const DESTINATAIRE_PERE = 'nicolas.maisonespadrille@gmail.com'

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
    const { commande, client, lignes, totalHT, totalPaires } = await req.json()

    const lignesHTML = lignes.map(l => {
      const tailles = Object.entries(l.qtys || {})
        .filter(([, v]) => parseInt(v) > 0)
        .map(([t, v]) => `T${t}×${v}`)
        .join(' ')
      const qty = Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0)
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${l.reference}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${l.coloris}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${tailles}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${qty}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${Number(l.total_ht || qty * l.prix).toFixed(2)} €</td>
        </tr>
      `
    }).join('')

    const htmlBody = `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1A1209">
        <div style="background:#1A1209;padding:24px;text-align:center">
          <h1 style="color:white;margin:0;font-size:22px">La Maison de l'Espadrille</h1>
          <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;font-size:14px">Bon de commande</p>
        </div>

        <div style="padding:24px;background:#F5EFE6">
          <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px">
            <h2 style="margin:0 0 12px;font-size:16px">Informations client</h2>
            <p style="margin:4px 0;font-size:14px"><strong>Magasin :</strong> ${client.magasin}</p>
            <p style="margin:4px 0;font-size:14px"><strong>Contact :</strong> ${client.nom}</p>
            <p style="margin:4px 0;font-size:14px"><strong>Email :</strong> ${client.email}</p>
            <p style="margin:4px 0;font-size:14px"><strong>Livraison :</strong> ${client.adresse_livraison}</p>
            <p style="margin:4px 0;font-size:14px"><strong>Facturation :</strong> ${client.adresse_facturation}</p>
          </div>

          <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px">
            <h2 style="margin:0 0 12px;font-size:16px">Détail de la commande</h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead>
                <tr style="background:#1A1209;color:white">
                  <th style="padding:8px;text-align:left">Référence</th>
                  <th style="padding:8px;text-align:left">Coloris</th>
                  <th style="padding:8px;text-align:left">Tailles</th>
                  <th style="padding:8px;text-align:center">Paires</th>
                  <th style="padding:8px;text-align:right">Total HT</th>
                </tr>
              </thead>
              <tbody>${lignesHTML}</tbody>
            </table>
          </div>

          <div style="background:white;border-radius:12px;padding:20px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px">
              <span>Total paires</span><strong>${totalPaires}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px">
              <span>Total HT</span><strong>${Number(totalHT).toFixed(2)} €</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px">
              <span>TVA 20%</span><strong>${(Number(totalHT) * 0.2).toFixed(2)} €</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:2px solid #1A1209;font-size:16px">
              <span><strong>Total TTC</strong></span><strong>${(Number(totalHT) * 1.2).toFixed(2)} €</strong>
            </div>
          </div>
        </div>

        <div style="padding:16px;text-align:center;font-size:12px;color:#9B8B7A">
          La Maison de l'Espadrille · Commande passée le ${new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    `

    // Email au père
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LME Commandes <onboarding@resend.dev>',
        to: [DESTINATAIRE_PERE],
        subject: `Nouvelle commande — ${client.magasin} — ${totalPaires} paires`,
        html: htmlBody,
      }),
    })

    // Email au client
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LME Commandes <onboarding@resend.dev>',
        to: [client.email],
        subject: `Votre commande — La Maison de l'Espadrille`,
        html: htmlBody,
      }),
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
})