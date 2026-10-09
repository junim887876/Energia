import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { valor, email, descricao } = req.body;
    const response = await payment.create({
      body: {
        transaction_amount: Number(valor || 10.00),
        description: descricao || 'Cobrança de Energia',
        payment_method_id: 'pix',
        payer: { email: email || 'cliente@email.com' }
      }
    });

    return res.status(200).json({
      id: response.id,
      qr_code: response.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: response.point_of_interaction.transaction_data.qr_code_base64
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
