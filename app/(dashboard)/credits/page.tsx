"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Coins, Plus, History, ArrowUpCircle, ArrowDownCircle, Gift, RefreshCcw, Loader2, Check } from "lucide-react";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string | null;
  createdAt: string;
}

export default function CreditsPage() {
  const { data: session, update: updateSession } = useSession();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [recharging, setRecharging] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (session?.user) {
      setCredits((session.user as any).credits || 0);
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [packagesRes, transactionsRes] = await Promise.all([
        fetch("/api/credits/packages"),
        fetch("/api/credits/transactions"),
      ]);

      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(packagesData);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (packageId: string) => {
    setRecharging(packageId);
    try {
      const response = await fetch("/api/credits/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
        // Update session with new credits
        await updateSession({ credits: data.credits });
        await fetchData();
        setDialogOpen(false);
      } else {
        const error = await response.json();
        alert(error.error || "充值失败");
      }
    } catch (error) {
      console.error("Recharge error:", error);
      alert("充值失败，请重试");
    } finally {
      setRecharging(null);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "recharge":
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case "consume":
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      case "gift":
        return <Gift className="h-4 w-4 text-purple-500" />;
      case "refund":
        return <RefreshCcw className="h-4 w-4 text-blue-500" />;
      default:
        return <Coins className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionTypeName = (type: string) => {
    switch (type) {
      case "recharge":
        return "充值";
      case "consume":
        return "消费";
      case "gift":
        return "赠送";
      case "refund":
        return "退款";
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">请先登录以查看积分</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">积分管理</h1>
          <p className="text-gray-500 mt-1">管理您的积分余额和交易记录</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credits Balance Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              可用积分
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <Coins className="h-8 w-8 text-purple-600" />
              <span className="text-4xl font-bold text-purple-600">{credits}</span>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              积分可用于生成背景图、AI 文案和图片分析等服务
            </p>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-6 w-full" size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  充值积分
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>选择充值套餐</DialogTitle>
                  <DialogDescription>
                    选择适合您的积分套餐进行充值
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {packages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      暂无可用套餐
                    </div>
                  ) : (
                    packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{pkg.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Coins className="h-4 w-4 text-purple-500" />
                            <span className="text-purple-600 font-medium">
                              {pkg.credits} 积分
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            ¥{pkg.price}
                          </div>
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => handleRecharge(pkg.id)}
                            disabled={recharging !== null}
                          >
                            {recharging === pkg.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                处理中
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                购买
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  * 当前为测试模式，充值将直接到账
                </p>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Transaction History Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                交易记录
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无交易记录</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(tx.type)}
                      <div>
                        <div className="font-medium text-sm">
                          {tx.description || getTransactionTypeName(tx.type)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(tx.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-semibold ${
                          tx.amount > 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount}
                      </div>
                      <div className="text-xs text-gray-400">
                        余额: {tx.balance}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Stats */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">积分消耗说明</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Coins className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">背景图生成</div>
                  <div className="text-sm text-gray-500">每次消耗 1-5 积分</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Coins className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">图片分析</div>
                  <div className="text-sm text-gray-500">每次消耗 1 积分</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Coins className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">AI 文案生成</div>
                  <div className="text-sm text-gray-500">每次消耗 1 积分</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
