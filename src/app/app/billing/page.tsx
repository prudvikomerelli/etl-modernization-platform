import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, Zap } from "lucide-react";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const plans = [
  {
    name: "FREE",
    displayName: "Free",
    price: "$0",
    period: "forever",
    features: ["3 projects", "5 conversions/day", "5 MB file limit", "Airflow only"],
  },
  {
    name: "PRO",
    displayName: "Pro",
    price: "$49",
    period: "/month",
    features: ["25 projects", "50 conversions/day", "50 MB file limit", "All 6 platforms", "Advanced validation"],
  },
  {
    name: "ENTERPRISE",
    displayName: "Enterprise",
    price: "Custom",
    period: "",
    features: ["Unlimited projects", "Unlimited conversions", "500 MB file limit", "All platforms", "Team support"],
  },
];

const planLimits: Record<string, { projects: number; conversions: number; storageMb: number }> = {
  FREE: { projects: 3, conversions: 5, storageMb: 5 },
  PRO: { projects: 25, conversions: 50, storageMb: 50 },
  ENTERPRISE: { projects: 9999, conversions: 9999, storageMb: 500 },
};

export default async function BillingPage() {
  const dbUser = await getOrCreateDbUser();
  const currentPlan = dbUser.subscription?.plan || "FREE";
  const limits = planLimits[currentPlan];

  const projectCount = await prisma.project.count({ where: { userId: dbUser.id } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayUsage = await prisma.usage.findUnique({
    where: { userId_date: { userId: dbUser.id, date: today } },
  });

  const conversionsToday = todayUsage?.conversionsCount || 0;

  // Calculate total storage
  const storageResult = await prisma.sourceFile.aggregate({
    where: { project: { userId: dbUser.id } },
    _sum: { fileSizeBytes: true },
  });
  const storageMbUsed = Number(storageResult._sum.fileSizeBytes || 0) / (1024 * 1024);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your subscription and billing details.</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-3">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {plans.find((p) => p.name === currentPlan)?.displayName || currentPlan} Plan
                </p>
                <p className="text-sm text-gray-500">
                  {limits.projects === 9999 ? "Unlimited" : limits.projects} projects • {limits.conversions === 9999 ? "Unlimited" : limits.conversions} conversions/day
                </p>
              </div>
            </div>
            <Badge variant="success">{dbUser.subscription?.status || "ACTIVE"}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Projects</span>
                <span className="text-sm font-medium text-gray-900">
                  {projectCount} / {limits.projects === 9999 ? "∞" : limits.projects}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${Math.min((projectCount / limits.projects) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Conversions Today</span>
                <span className="text-sm font-medium text-gray-900">
                  {conversionsToday} / {limits.conversions === 9999 ? "∞" : limits.conversions}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-green-600"
                  style={{ width: `${Math.min((conversionsToday / limits.conversions) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Storage</span>
                <span className="text-sm font-medium text-gray-900">
                  {storageMbUsed.toFixed(1)} MB / {limits.storageMb} MB
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-purple-600"
                  style={{ width: `${Math.min((storageMbUsed / limits.storageMb) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.name === currentPlan;
            return (
              <Card key={plan.name} className={isCurrent ? "ring-2 ring-blue-600" : ""}>
                <CardContent className="pt-6">
                  <div className="mb-4">
                    {isCurrent && <Badge variant="info" className="mb-2">Current Plan</Badge>}
                    <h3 className="text-xl font-bold text-gray-900">{plan.displayName}</h3>
                    <div className="flex items-baseline mt-1">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="ml-1 text-gray-500">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={plan.name === "PRO" ? "primary" : "outline"}
                      className="w-full"
                    >
                      {plan.name === "ENTERPRISE" ? "Contact Sales" : `Upgrade to ${plan.displayName}`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
