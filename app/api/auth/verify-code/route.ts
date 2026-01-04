import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const verifyCodeSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  code: z.string().length(6, '验证码必须是6位'),
  type: z.enum(['login', 'register']),
  name: z.string().min(2).optional(), // 注册时可提供名称
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code, type, name } = verifyCodeSchema.parse(body);

    // 查找有效的验证码
    const smsCode = await prisma.smsCode.findFirst({
      where: {
        phone,
        code,
        type,
        used: false,
        expires: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!smsCode) {
      return NextResponse.json(
        { message: '验证码无效或已过期' },
        { status: 400 }
      );
    }

    // 标记验证码为已使用
    await prisma.smsCode.update({
      where: { id: smsCode.id },
      data: { used: true },
    });

    let user;

    if (type === 'register') {
      // 检查用户是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: '该手机号已注册' },
          { status: 400 }
        );
      }

      // 创建新用户
      user = await prisma.user.create({
        data: {
          phone,
          phoneVerified: new Date(),
          name: name || `用户${phone.slice(-4)}`,
          credits: 100,
        },
      });
    } else {
      // 登录：查找用户
      user = await prisma.user.findUnique({
        where: { phone },
      });

      if (!user) {
        return NextResponse.json(
          { message: '用户不存在' },
          { status: 400 }
        );
      }

      // 更新手机验证状态
      if (!user.phoneVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { phoneVerified: new Date() },
        });
      }
    }

    // 返回用户信息（供 NextAuth 使用）
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        image: user.image,
        credits: user.credits,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    console.error('Verify code error:', error);
    return NextResponse.json(
      { message: '验证失败，请稍后重试' },
      { status: 500 }
    );
  }
}

