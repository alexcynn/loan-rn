"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, ArrowRight, ExternalLink } from "lucide-react"

// 가상의 부동산 뉴스 데이터
const newsData = [
  {
    id: 1,
    title: "서울 아파트 평균 매매가 9억원 돌파",
    summary: "서울 아파트 평균 매매가가 처음으로 9억원을 넘어서며 역대 최고치를 기록했습니다.",
    content:
      "한국부동산원이 발표한 최신 통계에 따르면, 서울 아파트 평균 매매가가 9억 1,200만원을 기록하며 처음으로 9억원을 돌파했습니다. 이는 전월 대비 2.3% 상승한 수치로, 강남 3구를 중심으로 한 고가 아파트의 가격 상승이 주요 원인으로 분석됩니다.",
    date: "2024-01-15",
    category: "시장동향",
  },
  {
    id: 2,
    title: "정부, 대출 규제 완화 검토",
    summary: "정부가 부동산 시장 활성화를 위해 DSR 규제 완화를 검토 중인 것으로 알려졌습니다.",
    content:
      "정부가 침체된 부동산 시장을 활성화하기 위해 총부채원리금상환비율(DSR) 규제 완화를 검토하고 있다고 관계자가 밝혔습니다. 현재 40%인 DSR 한도를 45%까지 상향 조정하는 방안이 논의되고 있습니다.",
    date: "2024-01-14",
    category: "정책",
  },
  {
    id: 3,
    title: "수도권 신규 분양 물량 급증",
    summary: "올해 수도권 신규 분양 물량이 전년 대비 30% 증가할 것으로 예상됩니다.",
    content:
      "부동산 업계에 따르면 올해 수도권 신규 분양 물량이 15만 가구를 넘어설 것으로 예상된다고 발표했습니다. 이는 전년 대비 30% 증가한 수치로, 공급 확대 정책의 효과가 나타나고 있는 것으로 분석됩니다.",
    date: "2024-01-13",
    category: "분양",
  },
]

export default function Component() {
  const [propertyValue, setPropertyValue] = useState<number>(50000) // 부동산 가치 (만원)
  const [loanAmount, setLoanAmount] = useState<number>(35000) // 대출 금액 (만원)
  const [annualIncome, setAnnualIncome] = useState<number>(6000) // 연간 소득 (만원)
  const [existingDebt, setExistingDebt] = useState<number>(0) // 기존 부채 월 상환액 (만원)
  const [interestRate, setInterestRate] = useState<number>(3.5) // 금리 (%)
  const [loanTerm, setLoanTerm] = useState<number>(30) // 대출 기간 (년)
  const [repaymentType, setRepaymentType] = useState<"equal-payment" | "equal-principal" | "interest-only" | null>(null)

  const [ltv, setLtv] = useState<number>(0)
  const [dsr, setDsr] = useState<number>(0)
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0)
  const [selectedNews, setSelectedNews] = useState<(typeof newsData)[0] | null>(null)
  const [showNewsList, setShowNewsList] = useState(false)

  // 상환 스케줄 계산 함수들
  const [repaymentSchedule, setRepaymentSchedule] = useState<
    Array<{
      month: number
      payment: number
      principal: number
      interest: number
      balance: number
    }>
  >([])

  // 월 상환액 계산 (원리금균등상환)
  const calculateMonthlyPayment = (principal: number, rate: number, years: number) => {
    const monthlyRate = rate / 100 / 12
    const numberOfPayments = years * 12

    if (monthlyRate === 0) return principal / numberOfPayments

    return (
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    )
  }

  // 원리금균등상환 스케줄 계산
  const calculateEqualPaymentSchedule = (principal: number, rate: number, years: number) => {
    const monthlyRate = rate / 100 / 12
    const numberOfPayments = years * 12
    const monthlyPayment = calculateMonthlyPayment(principal, rate, years)

    const schedule = []
    let remainingBalance = principal

    for (let month = 1; month <= Math.min(12, numberOfPayments); month++) {
      const monthlyInterest = remainingBalance * monthlyRate
      const monthlyPrincipal = monthlyPayment - monthlyInterest
      remainingBalance -= monthlyPrincipal

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
        balance: Math.max(0, remainingBalance),
      })
    }

    return schedule
  }

  // 원금균등상환 스케줄 계산
  const calculateEqualPrincipalSchedule = (principal: number, rate: number, years: number) => {
    const monthlyRate = rate / 100 / 12
    const numberOfPayments = years * 12
    const monthlyPrincipal = principal / numberOfPayments

    const schedule = []
    let remainingBalance = principal

    for (let month = 1; month <= Math.min(12, numberOfPayments); month++) {
      const monthlyInterest = remainingBalance * monthlyRate
      const monthlyPayment = monthlyPrincipal + monthlyInterest
      remainingBalance -= monthlyPrincipal

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
        balance: Math.max(0, remainingBalance),
      })
    }

    return schedule
  }

  // 원금일시상환 스케줄 계산
  const calculateInterestOnlySchedule = (principal: number, rate: number, years: number) => {
    const monthlyRate = rate / 100 / 12
    const monthlyInterest = principal * monthlyRate

    const schedule = []
    for (let month = 1; month <= Math.min(12, years * 12); month++) {
      const isLastPayment = month === years * 12
      schedule.push({
        month,
        payment: isLastPayment ? principal + monthlyInterest : monthlyInterest,
        principal: isLastPayment ? principal : 0,
        interest: monthlyInterest,
        balance: isLastPayment ? 0 : principal,
      })
    }

    return schedule
  }

  useEffect(() => {
    // LTV 계산
    const calculatedLtv = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0
    setLtv(calculatedLtv)

    // 월 상환액 계산 (만원 단위로 계산)
    const monthly = calculateMonthlyPayment(loanAmount, interestRate, loanTerm)
    setMonthlyPayment(monthly)

    // DSR 계산
    const totalMonthlyDebt = monthly + existingDebt
    const monthlyIncome = annualIncome / 12
    const calculatedDsr = monthlyIncome > 0 ? (totalMonthlyDebt / monthlyIncome) * 100 : 0
    setDsr(calculatedDsr)

    // 상환 스케줄 계산
    if (repaymentType) {
      const schedule =
        repaymentType === "equal-payment"
          ? calculateEqualPaymentSchedule(loanAmount, interestRate, loanTerm)
          : repaymentType === "equal-principal"
            ? calculateEqualPrincipalSchedule(loanAmount, interestRate, loanTerm)
            : calculateInterestOnlySchedule(loanAmount, interestRate, loanTerm)
      setRepaymentSchedule(schedule)
    }
  }, [propertyValue, loanAmount, annualIncome, existingDebt, interestRate, loanTerm, repaymentType])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(amount))
  }

  const getLtvStatus = (ltv: number) => {
    if (ltv <= 70) return { status: "양호", color: "bg-green-500" }
    if (ltv <= 80) return { status: "주의", color: "bg-yellow-500" }
    return { status: "위험", color: "bg-red-500" }
  }

  const getDsrStatus = (dsr: number) => {
    if (dsr <= 40) return { status: "양호", color: "bg-green-500" }
    if (dsr <= 60) return { status: "주의", color: "bg-yellow-500" }
    return { status: "위험", color: "bg-red-500" }
  }

  const ltvStatus = getLtvStatus(ltv)
  const dsrStatus = getDsrStatus(dsr)

  if (showNewsList) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-6">
          <div className="max-w-4xl mx-auto">
            <Button
              className="text-white hover:bg-white/20 mb-4"
              onClick={() => setShowNewsList(false)}
            >
              ← 돌아가기
            </Button>
            <h1 className="text-2xl font-bold">부동산 뉴스</h1>
            <p className="text-orange-100">최신 부동산 시장 동향을 확인하세요</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          <div className="grid gap-4">
            {newsData.map((news) => (
              <Card
                key={news.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedNews(news)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <Badge>{news.category}</Badge>
                    <span className="text-sm text-gray-500">{news.date}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{news.title}</h3>
                  <p className="text-gray-600">{news.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (selectedNews) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-6">
          <div className="max-w-4xl mx-auto">
            <Button className="text-white hover:bg-white/20 mb-4" onClick={() => setSelectedNews(null)}>
              ← 돌아가기
            </Button>
            <Badge className="mb-2 bg-gray-200 text-gray-800">
              {selectedNews.category}
            </Badge>
            <h1 className="text-2xl font-bold mb-2">{selectedNews.title}</h1>
            <p className="text-orange-100">{selectedNews.date}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed">{selectedNews.content}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">상환금액 확인</h1>
        <p className="text-orange-100">총 대출이자와 상환금액을 한눈에 확인해 보세요</p>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* 메인 계산기 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 p-4 border-b">
            <h2 className="text-xl font-bold text-center flex items-center justify-center gap-2">
              <Calculator className="h-5 w-5 text-orange-500" />
              대출이자 계산기
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* 입력 폼 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">부동산 가치</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={propertyValue}
                      onChange={(e) => setPropertyValue(Number(e.target.value))}
                      className="pr-12 text-right"
                      placeholder="50000"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      만원
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">대출 금액</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="pr-12 text-right"
                      placeholder="35000"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      만원
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">연간 소득</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(Number(e.target.value))}
                      className="pr-12 text-right"
                      placeholder="6000"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      만원
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">기존 부채 월 상환액</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={existingDebt}
                      onChange={(e) => setExistingDebt(Number(e.target.value))}
                      className="pr-12 text-right"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      만원
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">금리</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="pr-8 text-right"
                      placeholder="3.5"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">대출 기간</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(Number(e.target.value))}
                      className="pr-8 text-right"
                      placeholder="30"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      년
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium">
              확인하기
            </Button>

            {/* 결과 표시 - LTV/DSR만 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-orange-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">LTV (담보인정비율)</span>
                  <Badge className={`${ltvStatus.color} text-white text-xs`}>{ltvStatus.status}</Badge>
                </div>
                <div className="text-2xl font-bold text-orange-600">{ltv.toFixed(1)}%</div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">DSR (총부채상환비율)</span>
                  <Badge className={`${dsrStatus.color} text-white text-xs`}>{dsrStatus.status}</Badge>
                </div>
                <div className="text-2xl font-bold text-blue-600">{dsr.toFixed(1)}%</div>
              </div>
            </div>

            {/* 상환 방식 선택 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-center">상환 방식을 선택하세요</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  className={`h-20 flex flex-col items-center justify-center ${
                    repaymentType === "equal-payment"
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "border-2 hover:border-orange-300"
                  }`}
                  onClick={() => setRepaymentType("equal-payment")}
                >
                  <div className="font-bold">원리금균등상환</div>
                  <div className="text-xs mt-1 opacity-80">매월 동일 금액</div>
                </Button>

                <Button
                  className={`h-20 flex flex-col items-center justify-center ${
                    repaymentType === "equal-principal"
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "border-2 hover:border-orange-300"
                  }`}
                  onClick={() => setRepaymentType("equal-principal")}
                >
                  <div className="font-bold">원금균등상환</div>
                  <div className="text-xs mt-1 opacity-80">매월 동일 원금</div>
                </Button>

                <Button
                  className={`h-20 flex flex-col items-center justify-center ${
                    repaymentType === "interest-only"
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "border-2 hover:border-orange-300"
                  }`}
                  onClick={() => setRepaymentType("interest-only")}
                >
                  <div className="font-bold">원금일시상환</div>
                  <div className="text-xs mt-1 opacity-80">만기 원금상환</div>
                </Button>
              </div>
            </div>

            {/* 선택된 상환 방식에 따른 결과 표시 */}
            {repaymentType && (
              <div className="space-y-6">
                {/* 총 대출이자 및 상환금액 */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">총 대출이자</div>
                    <div className="text-3xl font-bold text-orange-600 mb-4">
                      {repaymentType === "equal-payment" && formatCurrency(monthlyPayment * loanTerm * 12 - loanAmount)}
                      {repaymentType === "equal-principal" &&
                        formatCurrency(loanAmount * (interestRate / 100 / 12) * ((loanTerm * 12 + 1) / 2))}
                      {repaymentType === "interest-only" &&
                        formatCurrency(loanAmount * (interestRate / 100 / 12) * (loanTerm * 12))}{" "}
                      만원
                    </div>
                    <div className="text-sm text-gray-600 mb-1">총 상환금액</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {repaymentType === "equal-payment" && formatCurrency(monthlyPayment * loanTerm * 12)}
                      {repaymentType === "equal-principal" &&
                        formatCurrency(loanAmount + loanAmount * (interestRate / 100 / 12) * ((loanTerm * 12 + 1) / 2))}
                      {repaymentType === "interest-only" &&
                        formatCurrency(loanAmount + loanAmount * (interestRate / 100 / 12) * (loanTerm * 12))}{" "}
                      만원
                    </div>
                  </div>
                </div>

                {/* 상환 방식별 상세 정보 */}
                <Card className="rounded-xl">
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-4">
                      {repaymentType === "equal-payment" && "원리금균등상환"}
                      {repaymentType === "equal-principal" && "원금균등상환"}
                      {repaymentType === "interest-only" && "원금일시상환"}
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-orange-600">
                          {repaymentType === "equal-payment" && formatCurrency(monthlyPayment)}
                          {repaymentType === "equal-principal" &&
                            formatCurrency(loanAmount / (loanTerm * 12) + loanAmount * (interestRate / 100 / 12))}
                          {repaymentType === "interest-only" && formatCurrency(loanAmount * (interestRate / 100 / 12))}
                        </div>
                        <div className="text-sm text-gray-600">
                          {repaymentType === "equal-payment" && "월 상환액 (만원)"}
                          {repaymentType === "equal-principal" && "첫 달 상환액 (만원)"}
                          {repaymentType === "interest-only" && "월 이자 (만원)"}
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {repaymentType === "equal-payment" && formatCurrency(monthlyPayment * loanTerm * 12)}
                          {repaymentType === "equal-principal" &&
                            formatCurrency(
                              loanAmount + loanAmount * (interestRate / 100 / 12) * ((loanTerm * 12 + 1) / 2),
                            )}
                          {repaymentType === "interest-only" &&
                            formatCurrency(loanAmount + loanAmount * (interestRate / 100 / 12) * (loanTerm * 12))}
                        </div>
                        <div className="text-sm text-gray-600">총 상환액 (만원)</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {repaymentType === "equal-payment" &&
                            formatCurrency(monthlyPayment * loanTerm * 12 - loanAmount)}
                          {repaymentType === "equal-principal" &&
                            formatCurrency(loanAmount * (interestRate / 100 / 12) * ((loanTerm * 12 + 1) / 2))}
                          {repaymentType === "interest-only" &&
                            formatCurrency(loanAmount * (interestRate / 100 / 12) * (loanTerm * 12))}
                        </div>
                        <div className="text-sm text-gray-600">총 이자 (만원)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 12개월 상환 계획표 */}
                <Card className="rounded-xl">
                  <CardHeader>
                    <CardTitle>12개월 상환 계획표</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-center py-2">회차</th>
                            <th className="text-right py-2">월 상환액</th>
                            <th className="text-right py-2">원금</th>
                            <th className="text-right py-2">이자</th>
                            <th className="text-right py-2">잔여원금</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repaymentSchedule.map((item) => (
                            <tr key={item.month} className="border-b">
                              <td className="text-center py-2 font-medium">{item.month}개월</td>
                              <td className="text-right py-2 font-semibold">{formatCurrency(item.payment)}만원</td>
                              <td className="text-right py-2 text-blue-600">{formatCurrency(item.principal)}만원</td>
                              <td className="text-right py-2 text-orange-600">{formatCurrency(item.interest)}만원</td>
                              <td className="text-right py-2 text-gray-600">{formatCurrency(item.balance)}만원</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">상환 방식 특징:</span>
                          <ul className="mt-1 space-y-1 text-gray-600">
                            {repaymentType === "equal-payment" && (
                              <>
                                <li>• 매월 동일한 금액 상환</li>
                                <li>• 초기에는 이자 비중이 높음</li>
                                <li>• 가계 예산 관리가 용이</li>
                              </>
                            )}
                            {repaymentType === "equal-principal" && (
                              <>
                                <li>• 매월 동일한 원금 상환</li>
                                <li>• 시간이 지날수록 상환액 감소</li>
                                <li>• 총 이자 부담이 적음</li>
                              </>
                            )}
                            {repaymentType === "interest-only" && (
                              <>
                                <li>• 매월 이자만 납부</li>
                                <li>• 만기에 원금 일시 상환</li>
                                <li>• 초기 현금 흐름 부담 적음</li>
                                <li>• 총 이자 부담이 가장 큼</li>
                              </>
                            )}
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold">1년간 상환 총액:</span>
                          <div className="mt-1 text-lg font-bold text-green-600">
                            {formatCurrency(repaymentSchedule.reduce((sum, item) => sum + item.payment, 0))}만원
                          </div>
                          <div className="text-sm text-gray-600">
                            원금: {formatCurrency(repaymentSchedule.reduce((sum, item) => sum + item.principal, 0))}만원
                            | 이자: {formatCurrency(repaymentSchedule.reduce((sum, item) => sum + item.interest, 0))}
                            만원
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* 부동산 뉴스 섹션 */}
        <Card className="rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                부동산 뉴스
              </CardTitle>
              <Button
                onClick={() => setShowNewsList(true)}
                className="text-orange-600 hover:text-orange-700 bg-transparent border-none px-2 py-1 text-sm"
              >
                전체보기 <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {newsData.slice(0, 3).map((news) => (
                <div
                  key={news.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedNews(news)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <Badge className="text-xs">
                      {news.category}
                    </Badge>
                    <span className="text-xs text-gray-500">{news.date}</span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{news.title}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{news.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 광고 영역 */}
        <Card className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-bold mb-2">🏠 부동산 투자 상담</h3>
            <p className="text-blue-100 mb-4">전문가와 함께하는 맞춤형 부동산 투자 전략</p>
            <Button className="bg-white text-blue-600 hover:bg-gray-100">
              무료 상담 신청 <ExternalLink className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-bold mb-2">💰 최저금리 대출 비교</h3>
            <p className="text-green-100 mb-4">은행별 대출 상품을 한번에 비교하고 최적의 조건을 찾아보세요</p>
            <Button className="bg-white text-green-600 hover:bg-gray-100">
              대출 비교하기 <ExternalLink className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
