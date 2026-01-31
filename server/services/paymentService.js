/**
 * 支付服务
 * 生成支付二维码和核销码
 */

/**
 * 生成支付二维码
 * 开发环境返回模拟数据，生产环境调用真实API
 */
export async function generateQRCode(options) {
    const { orderId, amount, productName, paymentMethod } = options;

    // 开发环境：生成模拟二维码
    if (process.env.NODE_ENV !== 'production') {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const paymentUrl = `${baseUrl}/pay/confirm?orderId=${orderId}`;

        // 模拟二维码数据（实际项目中使用 qrcode 库生成）
        const qrCodeData = `data:image/svg+xml,${encodeURIComponent(generateSvgQRCode(paymentUrl, paymentMethod))}`;

        return {
            qrCode: qrCodeData,
            paymentUrl
        };
    }

    // 生产环境：调用支付宝/微信接口
    if (paymentMethod === 'alipay') {
        return await generateAlipayQRCode(orderId, amount, productName);
    } else if (paymentMethod === 'wechat') {
        return await generateWechatQRCode(orderId, amount, productName);
    }

    throw new Error('不支持的支付方式');
}

/**
 * 生成支付宝支付二维码
 * TODO: 接入真实支付宝 API
 */
async function generateAlipayQRCode(orderId, amount, productName) {
    // 这里需要接入支付宝开放平台API
    // 使用 alipay-sdk 或直接调用 API

    /*
    const AlipayFormData = require('alipay-sdk/lib/form').default;
    const formData = new AlipayFormData();
    formData.setMethod('get');
    formData.addField('bizContent', {
      out_trade_no: orderId,
      total_amount: amount.toFixed(2),
      subject: productName,
      product_code: 'FACE_TO_FACE_PAYMENT'
    });
    
    const result = await alipaySdk.exec(
      'alipay.trade.precreate',
      {},
      { formData }
    );
    
    return {
      qrCode: result.qr_code,
      paymentUrl: result.qr_code
    };
    */

    console.log('⚠️ 支付宝支付需要配置商户信息');
    throw new Error('支付宝支付暂未配置');
}

/**
 * 生成微信支付二维码
 * TODO: 接入真实微信支付 API
 */
async function generateWechatQRCode(orderId, amount, productName) {
    // 这里需要接入微信支付API
    // 使用 wechatpay-axios-plugin 或直接调用 API

    /*
    const result = await wxpay.v3.pay.transactions.native.post({
      appid: process.env.WECHAT_APP_ID,
      mchid: process.env.WECHAT_MCH_ID,
      description: productName,
      out_trade_no: orderId,
      notify_url: `${process.env.API_BASE_URL}/api/payment/notify`,
      amount: {
        total: Math.round(amount * 100), // 单位：分
        currency: 'CNY'
      }
    });
    
    return {
      qrCode: result.code_url,
      paymentUrl: result.code_url
    };
    */

    console.log('⚠️ 微信支付需要配置商户信息');
    throw new Error('微信支付暂未配置');
}

/**
 * 生成核销码（8位）
 */
export function generateRedeemCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * 生成 SVG 二维码（开发环境模拟用）
 */
function generateSvgQRCode(url, paymentMethod) {
    const color = paymentMethod === 'alipay' ? '#1677FF' : '#07C160';
    const icon = paymentMethod === 'alipay' ? '支' : '微';

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="white"/>
  <rect x="10" y="10" width="180" height="180" fill="white" stroke="${color}" stroke-width="2" rx="8"/>
  
  <!-- 模拟二维码图案 -->
  <g fill="${color}">
    <!-- 左上角定位点 -->
    <rect x="20" y="20" width="40" height="40"/>
    <rect x="25" y="25" width="30" height="30" fill="white"/>
    <rect x="30" y="30" width="20" height="20" fill="${color}"/>
    
    <!-- 右上角定位点 -->
    <rect x="140" y="20" width="40" height="40"/>
    <rect x="145" y="25" width="30" height="30" fill="white"/>
    <rect x="150" y="30" width="20" height="20" fill="${color}"/>
    
    <!-- 左下角定位点 -->
    <rect x="20" y="140" width="40" height="40"/>
    <rect x="25" y="145" width="30" height="30" fill="white"/>
    <rect x="30" y="150" width="20" height="20" fill="${color}"/>
    
    <!-- 随机填充 -->
    <rect x="70" y="20" width="10" height="10"/>
    <rect x="90" y="25" width="10" height="10"/>
    <rect x="110" y="20" width="10" height="10"/>
    
    <rect x="70" y="40" width="10" height="10"/>
    <rect x="80" y="50" width="10" height="10"/>
    <rect x="100" y="40" width="10" height="10"/>
    
    <rect x="20" y="70" width="10" height="10"/>
    <rect x="40" y="80" width="10" height="10"/>
    <rect x="50" y="70" width="10" height="10"/>
    
    <rect x="70" y="70" width="10" height="10"/>
    <rect x="90" y="80" width="10" height="10"/>
    <rect x="110" y="70" width="10" height="10"/>
    <rect x="120" y="90" width="10" height="10"/>
    
    <rect x="150" y="70" width="10" height="10"/>
    <rect x="160" y="80" width="10" height="10"/>
    <rect x="170" y="90" width="10" height="10"/>
    
    <rect x="70" y="100" width="10" height="10"/>
    <rect x="80" y="110" width="10" height="10"/>
    <rect x="100" y="100" width="10" height="10"/>
    <rect x="120" y="110" width="10" height="10"/>
    
    <rect x="70" y="130" width="10" height="10"/>
    <rect x="90" y="140" width="10" height="10"/>
    <rect x="100" y="150" width="10" height="10"/>
    <rect x="120" y="130" width="10" height="10"/>
    
    <rect x="140" y="140" width="10" height="10"/>
    <rect x="150" y="150" width="10" height="10"/>
    <rect x="170" y="160" width="10" height="10"/>
  </g>
  
  <!-- 中心 Logo -->
  <circle cx="100" cy="100" r="20" fill="white"/>
  <circle cx="100" cy="100" r="18" fill="${color}"/>
  <text x="100" y="106" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${icon}</text>
</svg>
`.trim();
}

export default { generateQRCode, generateRedeemCode };
