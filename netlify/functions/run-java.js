/**
 * Netlify Function (v2): chạy thật code Java qua Judge0 CE (xem _codeRunner.js
 * cho lý do chọn Judge0 thay vì Piston như kế hoạch gốc dự tính).
 * Endpoint khi deploy: POST /.netlify/functions/run-java
 *
 * Nhận { code } từ CodePlayground.vue, trả về { ok, stage, stdout, stderr }.
 */
import { runJavaCode, errorResponse } from './_codeRunner.js'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export default async (req, context) => {
  if (req.method !== 'POST')
    return json({ error: { code: 'bad_request', message: 'Method not allowed' } }, 405)

  try {
    const { code } = await req.json()
    const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || ''
    const result = await runJavaCode({ code, ip })
    return json(result)
  } catch (e) {
    const { status, body } = errorResponse(e)
    return json(body, status)
  }
}
