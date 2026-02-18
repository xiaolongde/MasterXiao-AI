// divination.js
import express from 'express';
import * as prompts from '../prompt/prompts.js';
import { callGeminiAPI } from '../services/aiService.js';

const router = express.Router();

// POST /api/divination
router.post('/', async (req, res) => {
    console.log('[解卦API] 收到请求');
  try {
    const { prompt, guaData } = req.body;

    // 只支持新方式：服务端组装提示词
    let finalPrompt;
    if (guaData) {
      const { question, benGuaInfo, bianGuaInfo, yaos, movingPositions, questionCategory, gender } = guaData;
      if (!question || !benGuaInfo || !yaos) {
        return res.status(400).json({ success: false, error: '缺少必要的卦象数据' });
      }
      finalPrompt = prompts.generateAIPrompt({
        question,
        benGuaInfo,
        bianGuaInfo,
        yaos,
        movingPositions,
        questionCategory,
        gender
      });
    } else if (prompt) {
      finalPrompt = prompt;
    } else {
      return res.status(400).json({ success: false, error: '缺少解卦数据' });
    }

    // 调用 Gemini API
    const response = await callGeminiAPI(finalPrompt);
    // 解析双版本内容
    const parsed = parseDoubleVersion(response);
    res.json({
      success: true,
      data: {
        result: response,
        professionalVersion: parsed.professional,
        simpleVersion: parsed.simple,
        aiPrompt: finalPrompt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || '解卦失败' });
  }
});

// 解析双版本内容
function parseDoubleVersion(content) {
  let professional = '';
  let simple = '';
  const pattern1 = /[一1][\s、\.]*专业版?[解读]*[（\(]?[给专业人士]*[）\)]?[\s\S]*?([\s\S]*?)[二2][\s、\.]*通俗版?[解读]*[（\(]?[给普通用户]*[）\)]?[\s\S]*?([\s\S]*?)$/i;
  const pattern2 = /【专业版[解读]*】([\s\S]*?)【通俗版[解读]*】([\s\S]*?)$/i;
  const pattern3 = /##?\s*专业版[解读]*\s*([\s\S]*?)##?\s*通俗版[解读]*\s*([\s\S]*?)$/i;
  let match = content.match(pattern1) || content.match(pattern2) || content.match(pattern3);
  if (match) {
    professional = match[1].trim();
    simple = match[2].trim();
  } else {
    professional = content;
    simple = content;
  }
  return { professional, simple };
}

export default router;
