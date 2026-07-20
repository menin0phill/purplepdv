// api/asaas.js
// Serverless Function Node.js para integração com a API v3 do Asaas

export default async function handler(req, res) {
  // Configurar cabeçalhos de CORS e JSON
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { amount, paymentMethod, customerName, customerEmail, customerPhone, apiKey, mode, orderId } = req.body;

    if (!amount || !paymentMethod || !customerName || !apiKey) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes: amount, paymentMethod, customerName, apiKey.' });
    }

    // Se estiver em modo simulado, retorna dados mockados
    const isSimulated = mode === 'simulated';

    if (isSimulated) {
      if (paymentMethod === 'PIX') {
        const pixKey = "00020101021226930014br.gov.bcb.pix2571pix-qrcode.asaas.com/v3/simulated_purple_test_" + Date.now() + "5204000053039865405" + Number(amount).toFixed(2) + "5802BR5925Purple Cosméticos6009Sao Paulo62070503***6304";
        return res.status(200).json({
          success: true,
          simulated: true,
          pixKey: pixKey,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixKey)}`
        });
      } else {
        return res.status(200).json({
          success: true,
          simulated: true,
          checkoutUrl: "https://sandbox.asaas.com/i/simulado_" + Date.now()
        });
      }
    }

    // --- Integração Real com Asaas ---
    // Determinar URL base com base no prefixo da chave API
    const isProdKey = apiKey.startsWith('aact_prod_') || apiKey.startsWith('$aact_prod_');
    const baseUrl = isProdKey ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3';

    // Limpar o prefixo da chave se ela veio envelopada (ex: vinda do chat)
    const cleanApiKey = apiKey.replace(/^\$/, '').replace(/\$$/, '').trim();

    // 1. Cadastrar Cliente no Asaas
    const customerResponse = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': cleanApiKey
      },
      body: JSON.stringify({
        name: customerName,
        email: customerEmail || undefined,
        phone: customerPhone || undefined,
        notificationDisabled: true
      })
    });

    if (!customerResponse.ok) {
      const errData = await customerResponse.json().catch(() => ({}));
      throw new Error(errData.errors?.[0]?.description || 'Erro ao cadastrar cliente no Asaas.');
    }

    const customerData = await customerResponse.json();
    const customerId = customerData.id;

    // Calcular data de vencimento (1 dia a partir de agora)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDateStr = tomorrow.toISOString().split('T')[0];

    // 2. Criar Cobrança no Asaas
    const paymentResponse = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': cleanApiKey
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX',
        value: parseFloat(amount),
        dueDate: dueDateStr,
        description: `Pedido #${orderId.split('_')[1] || orderId} - Purple Cosméticos`,
        externalReference: orderId
      })
    });

    if (!paymentResponse.ok) {
      const errData = await paymentResponse.json().catch(() => ({}));
      throw new Error(errData.errors?.[0]?.description || 'Erro ao gerar cobrança no Asaas.');
    }

    const paymentData = await paymentResponse.json();
    const paymentId = paymentData.id;
    const invoiceUrl = paymentData.invoiceUrl;

    // 3. Obter QR Code e Copia e Cola se for Pix
    if (paymentMethod === 'PIX') {
      const pixQrResponse = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, {
        method: 'GET',
        headers: {
          'access_token': cleanApiKey
        }
      });

      if (!pixQrResponse.ok) {
        throw new Error('Falha ao obter QR Code Pix do Asaas.');
      }

      const pixQrData = await pixQrResponse.json();
      return res.status(200).json({
        success: true,
        simulated: false,
        pixKey: pixQrData.payload, // Chave Copia e Cola
        qrCode: `data:image/png;base64,${pixQrData.encodedImage}`, // QR Code Base64
        paymentId: paymentId
      });
    }

    // 4. Retornar link da fatura para Cartão de Crédito
    return res.status(200).json({
      success: true,
      simulated: false,
      checkoutUrl: invoiceUrl,
      paymentId: paymentId
    });

  } catch (error) {
    console.error('Erro na rota serverless asaas:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar pagamento com o Asaas.',
      details: error.message
    });
  }
}
