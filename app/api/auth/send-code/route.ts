import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const sendCodeSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
});

// 生成 6 位数字验证码
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = sendCodeSchema.parse(body);

    // 检查是否在 60 秒内已发送过验证码
    const recentCode = await prisma.smsCode.findFirst({
      where: {
        phone,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
      },
    });

    if (recentCode) {
      return NextResponse.json(
        { message: '验证码已发送，请稍后再试' },
        { status: 429 }
      );
    }

    // 生成验证码
    const code = generateCode();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 分钟有效期

    // 保存验证码到数据库
    await prisma.smsCode.create({
      data: {
        phone,
        code,
        type: 'login', // 统一使用 login 类型，登录时自动注册
        expires,
      },
    });

    // TODO: 调用短信服务发送验证码
    // 这里需要集成实际的短信服务（如阿里云、腾讯云等）
    // await sendSms(phone, code);
    
    console.log(`[SMS] 验证码发送到 ${phone}: ${code}`); // 开发环境打印验证码

    return NextResponse.json(
      { message: '验证码已发送', success: true },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    console.error('Send code error:', error);
    return NextResponse.json(
      { message: '发送验证码失败，请稍后重试' },
      { status: 500 }
    );
  }
}

