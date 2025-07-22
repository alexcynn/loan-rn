"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")

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

type RepaymentType = "equal-payment" | "equal-principal" | "interest-only" | null

interface ScheduleItem {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export default function App() {
  const [propertyValue, setPropertyValue] = useState<string>("50000")
  const [loanAmount, setLoanAmount] = useState<string>("35000")
  const [annualIncome, setAnnualIncome] = useState<string>("6000")
  const [existingDebt, setExistingDebt] = useState<string>("0")
  const [interestRate, setInterestRate] = useState<string>("3.5")
  const [loanTerm, setLoanTerm] = useState<string>("30")
  const [repaymentType, setRepaymentType] = useState<RepaymentType>(null)

  const [ltv, setLtv] = useState<number>(0)
  const [dsr, setDsr] = useState<number>(0)
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0)
  const [repaymentSchedule, setRepaymentSchedule] = useState<ScheduleItem[]>([])
  const [selectedNews, setSelectedNews] = useState<(typeof newsData)[0] | null>(null)
  const [showNewsList, setShowNewsList] = useState(false)

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
    const propValue = Number.parseFloat(propertyValue) || 0
    const loanAmt = Number.parseFloat(loanAmount) || 0
    const annualInc = Number.parseFloat(annualIncome) || 0
    const existingDebtAmt = Number.parseFloat(existingDebt) || 0
    const intRate = Number.parseFloat(interestRate) || 0
    const loanTermYears = Number.parseFloat(loanTerm) || 0

    // LTV 계산
    const calculatedLtv = propValue > 0 ? (loanAmt / propValue) * 100 : 0
    setLtv(calculatedLtv)

    // 월 상환액 계산
    const monthly = calculateMonthlyPayment(loanAmt, intRate, loanTermYears)
    setMonthlyPayment(monthly)

    // DSR 계산
    const totalMonthlyDebt = monthly + existingDebtAmt
    const monthlyIncome = annualInc / 12
    const calculatedDsr = monthlyIncome > 0 ? (totalMonthlyDebt / monthlyIncome) * 100 : 0
    setDsr(calculatedDsr)

    // 상환 스케줄 계산
    if (repaymentType) {
      const schedule =
        repaymentType === "equal-payment"
          ? calculateEqualPaymentSchedule(loanAmt, intRate, loanTermYears)
          : repaymentType === "equal-principal"
            ? calculateEqualPrincipalSchedule(loanAmt, intRate, loanTermYears)
            : calculateInterestOnlySchedule(loanAmt, intRate, loanTermYears)
      setRepaymentSchedule(schedule)
    }
  }, [propertyValue, loanAmount, annualIncome, existingDebt, interestRate, loanTerm, repaymentType])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(amount))
  }

  const getLtvStatus = (ltv: number) => {
    if (ltv <= 70) return { status: "양호", color: "#10B981" }
    if (ltv <= 80) return { status: "주의", color: "#F59E0B" }
    return { status: "위험", color: "#EF4444" }
  }

  const getDsrStatus = (dsr: number) => {
    if (dsr <= 40) return { status: "양호", color: "#10B981" }
    if (dsr <= 60) return { status: "주의", color: "#F59E0B" }
    return { status: "위험", color: "#EF4444" }
  }

  const ltvStatus = getLtvStatus(ltv)
  const dsrStatus = getDsrStatus(dsr)

  const handleCalculate = () => {
    if (!propertyValue || !loanAmount || !annualIncome || !interestRate || !loanTerm) {
      Alert.alert("알림", "모든 필수 항목을 입력해주세요.")
      return
    }
    Alert.alert("계산 완료", "대출 정보가 계산되었습니다.")
  }

  if (showNewsList) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#FB923C", "#F97316"]} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setShowNewsList(false)}>
            <Text style={styles.backButtonText}>← 돌아가기</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>부동산 뉴스</Text>
          <Text style={styles.headerSubtitle}>최신 부동산 시장 동향을 확인하세요</Text>
        </LinearGradient>

        <ScrollView style={styles.content}>
          {newsData.map((news) => (
            <TouchableOpacity key={news.id} style={styles.newsCard} onPress={() => setSelectedNews(news)}>
              <View style={styles.newsHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{news.category}</Text>
                </View>
                <Text style={styles.newsDate}>{news.date}</Text>
              </View>
              <Text style={styles.newsTitle}>{news.title}</Text>
              <Text style={styles.newsSummary}>{news.summary}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (selectedNews) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#FB923C", "#F97316"]} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedNews(null)}>
            <Text style={styles.backButtonText}>← 돌아가기</Text>
          </TouchableOpacity>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{selectedNews.category}</Text>
          </View>
          <Text style={styles.headerTitle}>{selectedNews.title}</Text>
          <Text style={styles.headerSubtitle}>{selectedNews.date}</Text>
        </LinearGradient>

        <ScrollView style={styles.content}>
          <View style={styles.newsDetailCard}>
            <Text style={styles.newsContent}>{selectedNews.content}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#FB923C", "#F97316"]} style={styles.header}>
        <Text style={styles.headerTitle}>상환금액 확인</Text>
        <Text style={styles.headerSubtitle}>총 대출이자와 상환금액을 한눈에 확인해 보세요</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* 메인 계산기 */}
        <View style={styles.calculatorCard}>
          <View style={styles.calculatorHeader}>
            <Text style={styles.calculatorTitle}>📱 대출이자 계산기</Text>
          </View>

          <View style={styles.inputSection}>
            {/* 입력 폼 */}
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>부동산 가치</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={propertyValue}
                    onChangeText={setPropertyValue}
                    placeholder="50000"
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputUnit}>만원</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>대출 금액</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={loanAmount}
                    onChangeText={setLoanAmount}
                    placeholder="35000"
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputUnit}>만원</Text>
                </View>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>연간 소득</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={annualIncome}
                    onChangeText={setAnnualIncome}
                    placeholder="6000"
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputUnit}>만원</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>기존 부채 월 상환액</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={existingDebt}
                    onChangeText={setExistingDebt}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputUnit}>만원</Text>
                </View>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>금리</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={interestRate}
                    onChangeText={setInterestRate}
                    placeholder="3.5"
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputUnit}>%</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>대출 기간</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={loanTerm}
                    onChangeText={setLoanTerm}
                    placeholder="30"
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputUnit}>년</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
              <Text style={styles.calculateButtonText}>확인하기</Text>
            </TouchableOpacity>

            {/* LTV/DSR 결과 */}
            <View style={styles.resultRow}>
              <View style={[styles.resultCard, { backgroundColor: "#FFF7ED" }]}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultLabel}>LTV (담보인정비율)</Text>
                  <View style={[styles.statusBadge, { backgroundColor: ltvStatus.color }]}>
                    <Text style={styles.statusText}>{ltvStatus.status}</Text>
                  </View>
                </View>
                <Text style={[styles.resultValue, { color: "#EA580C" }]}>{ltv.toFixed(1)}%</Text>
              </View>

              <View style={[styles.resultCard, { backgroundColor: "#EFF6FF" }]}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultLabel}>DSR (총부채상환비율)</Text>
                  <View style={[styles.statusBadge, { backgroundColor: dsrStatus.color }]}>
                    <Text style={styles.statusText}>{dsrStatus.status}</Text>
                  </View>
                </View>
                <Text style={[styles.resultValue, { color: "#2563EB" }]}>{dsr.toFixed(1)}%</Text>
              </View>
            </View>

            {/* 상환 방식 선택 */}
            <View style={styles.repaymentSection}>
              <Text style={styles.sectionTitle}>상환 방식을 선택하세요</Text>
              <View style={styles.repaymentButtons}>
                <TouchableOpacity
                  style={[styles.repaymentButton, repaymentType === "equal-payment" && styles.repaymentButtonActive]}
                  onPress={() => setRepaymentType("equal-payment")}
                >
                  <Text
                    style={[
                      styles.repaymentButtonText,
                      repaymentType === "equal-payment" && styles.repaymentButtonTextActive,
                    ]}
                  >
                    원리금균등상환
                  </Text>
                  <Text
                    style={[
                      styles.repaymentButtonSubtext,
                      repaymentType === "equal-payment" && styles.repaymentButtonSubtextActive,
                    ]}
                  >
                    매월 동일 금액
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.repaymentButton, repaymentType === "equal-principal" && styles.repaymentButtonActive]}
                  onPress={() => setRepaymentType("equal-principal")}
                >
                  <Text
                    style={[
                      styles.repaymentButtonText,
                      repaymentType === "equal-principal" && styles.repaymentButtonTextActive,
                    ]}
                  >
                    원금균등상환
                  </Text>
                  <Text
                    style={[
                      styles.repaymentButtonSubtext,
                      repaymentType === "equal-principal" && styles.repaymentButtonSubtextActive,
                    ]}
                  >
                    매월 동일 원금
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.repaymentButton, repaymentType === "interest-only" && styles.repaymentButtonActive]}
                  onPress={() => setRepaymentType("interest-only")}
                >
                  <Text
                    style={[
                      styles.repaymentButtonText,
                      repaymentType === "interest-only" && styles.repaymentButtonTextActive,
                    ]}
                  >
                    원금일시상환
                  </Text>
                  <Text
                    style={[
                      styles.repaymentButtonSubtext,
                      repaymentType === "interest-only" && styles.repaymentButtonSubtextActive,
                    ]}
                  >
                    만기 원금상환
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 선택된 상환 방식에 따른 결과 */}
            {repaymentType && (
              <View style={styles.resultsSection}>
                {/* 총 대출이자 및 상환금액 */}
                <View style={styles.totalResultCard}>
                  <Text style={styles.totalResultLabel}>총 대출이자</Text>
                  <Text style={styles.totalResultValue}>
                    {repaymentType === "equal-payment" &&
                      formatCurrency(monthlyPayment * Number.parseFloat(loanTerm) * 12 - Number.parseFloat(loanAmount))}
                    {repaymentType === "equal-principal" &&
                      formatCurrency(
                        Number.parseFloat(loanAmount) *
                          (Number.parseFloat(interestRate) / 100 / 12) *
                          ((Number.parseFloat(loanTerm) * 12 + 1) / 2),
                      )}
                    {repaymentType === "interest-only" &&
                      formatCurrency(
                        Number.parseFloat(loanAmount) *
                          (Number.parseFloat(interestRate) / 100 / 12) *
                          (Number.parseFloat(loanTerm) * 12),
                      )}{" "}
                    만원
                  </Text>
                  <Text style={styles.totalResultLabel}>총 상환금액</Text>
                  <Text style={styles.totalResultValueMain}>
                    {repaymentType === "equal-payment" &&
                      formatCurrency(monthlyPayment * Number.parseFloat(loanTerm) * 12)}
                    {repaymentType === "equal-principal" &&
                      formatCurrency(
                        Number.parseFloat(loanAmount) +
                          Number.parseFloat(loanAmount) *
                            (Number.parseFloat(interestRate) / 100 / 12) *
                            ((Number.parseFloat(loanTerm) * 12 + 1) / 2),
                      )}
                    {repaymentType === "interest-only" &&
                      formatCurrency(
                        Number.parseFloat(loanAmount) +
                          Number.parseFloat(loanAmount) *
                            (Number.parseFloat(interestRate) / 100 / 12) *
                            (Number.parseFloat(loanTerm) * 12),
                      )}{" "}
                    만원
                  </Text>
                </View>

                {/* 상환 방식별 상세 정보 */}
                <View style={styles.detailCard}>
                  <Text style={styles.detailTitle}>
                    {repaymentType === "equal-payment" && "원리금균등상환"}
                    {repaymentType === "equal-principal" && "원금균등상환"}
                    {repaymentType === "interest-only" && "원금일시상환"}
                  </Text>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailValue}>
                        {repaymentType === "equal-payment" && formatCurrency(monthlyPayment)}
                        {repaymentType === "equal-principal" &&
                          formatCurrency(
                            Number.parseFloat(loanAmount) / (Number.parseFloat(loanTerm) * 12) +
                              Number.parseFloat(loanAmount) * (Number.parseFloat(interestRate) / 100 / 12),
                          )}
                        {repaymentType === "interest-only" &&
                          formatCurrency(Number.parseFloat(loanAmount) * (Number.parseFloat(interestRate) / 100 / 12))}
                      </Text>
                      <Text style={styles.detailLabel}>
                        {repaymentType === "equal-payment" && "월 상환액 (만원)"}
                        {repaymentType === "equal-principal" && "첫 달 상환액 (만원)"}
                        {repaymentType === "interest-only" && "월 이자 (만원)"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 12개월 상환 계획표 */}
                <View style={styles.scheduleCard}>
                  <Text style={styles.scheduleTitle}>12개월 상환 계획표</Text>
                  <View style={styles.scheduleTable}>
                    <View style={styles.scheduleHeader}>
                      <Text style={styles.scheduleHeaderText}>회차</Text>
                      <Text style={styles.scheduleHeaderText}>월 상환액</Text>
                      <Text style={styles.scheduleHeaderText}>원금</Text>
                      <Text style={styles.scheduleHeaderText}>이자</Text>
                      <Text style={styles.scheduleHeaderText}>잔여원금</Text>
                    </View>
                    {repaymentSchedule.slice(0, 6).map((item) => (
                      <View key={item.month} style={styles.scheduleRow}>
                        <Text style={styles.scheduleCellCenter}>{item.month}개월</Text>
                        <Text style={styles.scheduleCell}>{formatCurrency(item.payment)}</Text>
                        <Text style={styles.scheduleCell}>{formatCurrency(item.principal)}</Text>
                        <Text style={styles.scheduleCell}>{formatCurrency(item.interest)}</Text>
                        <Text style={styles.scheduleCell}>{formatCurrency(item.balance)}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.scheduleNote}>* 처음 6개월만 표시됩니다</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 부동산 뉴스 섹션 */}
        <View style={styles.newsSection}>
          <View style={styles.newsSectionHeader}>
            <Text style={styles.newsSectionTitle}>📈 부동산 뉴스</Text>
            <TouchableOpacity onPress={() => setShowNewsList(true)}>
              <Text style={styles.viewAllButton}>전체보기 →</Text>
            </TouchableOpacity>
          </View>
          {newsData.slice(0, 3).map((news) => (
            <TouchableOpacity key={news.id} style={styles.newsItem} onPress={() => setSelectedNews(news)}>
              <View style={styles.newsItemHeader}>
                <View style={styles.categoryBadgeSmall}>
                  <Text style={styles.categoryTextSmall}>{news.category}</Text>
                </View>
                <Text style={styles.newsDateSmall}>{news.date}</Text>
              </View>
              <Text style={styles.newsTitleSmall}>{news.title}</Text>
              <Text style={styles.newsSummarySmall}>{news.summary}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 광고 영역 */}
        <LinearGradient colors={["#3B82F6", "#8B5CF6"]} style={styles.adCard}>
          <Text style={styles.adTitle}>🏠 부동산 투자 상담</Text>
          <Text style={styles.adSubtitle}>전문가와 함께하는 맞춤형 부동산 투자 전략</Text>
          <TouchableOpacity style={styles.adButton}>
            <Text style={styles.adButtonText}>무료 상담 신청</Text>
          </TouchableOpacity>
        </LinearGradient>

        <LinearGradient colors={["#10B981", "#14B8A6"]} style={styles.adCard}>
          <Text style={styles.adTitle}>💰 최저금리 대출 비교</Text>
          <Text style={styles.adSubtitle}>은행별 대출 상품을 한번에 비교하고 최적의 조건을 찾아보세요</Text>
          <TouchableOpacity style={styles.adButton}>
            <Text style={styles.adButtonText}>대출 비교하기</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    padding: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  calculatorCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calculatorHeader: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  calculatorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  inputSection: {
    padding: 24,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "white",
  },
  textInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    textAlign: "right",
  },
  inputUnit: {
    paddingRight: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  calculateButton: {
    backgroundColor: "#F97316",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: 24,
  },
  calculateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  resultCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  resultValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  repaymentSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  repaymentButtons: {
    gap: 12,
  },
  repaymentButton: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  repaymentButtonActive: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  repaymentButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
  },
  repaymentButtonTextActive: {
    color: "white",
  },
  repaymentButtonSubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  repaymentButtonSubtextActive: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  resultsSection: {
    marginTop: 24,
  },
  totalResultCard: {
    backgroundColor: "#F9FAFB",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  totalResultLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  totalResultValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F97316",
    marginBottom: 16,
  },
  totalResultValueMain: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
  },
  detailCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  detailRow: {
    alignItems: "center",
  },
  detailItem: {
    alignItems: "center",
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F97316",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  scheduleCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  scheduleTable: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  scheduleHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  scheduleHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  scheduleRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  scheduleCellCenter: {
    flex: 1,
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
  },
  scheduleCell: {
    flex: 1,
    fontSize: 10,
    textAlign: "center",
  },
  scheduleNote: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  newsSection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  newsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  newsSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  viewAllButton: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "600",
  },
  newsItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 8,
  },
  newsItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeSmall: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    color: "#374151",
  },
  categoryTextSmall: {
    fontSize: 10,
    color: "#374151",
  },
  newsDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  newsDateSmall: {
    fontSize: 10,
    color: "#6B7280",
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  newsTitleSmall: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  newsSummary: {
    fontSize: 14,
    color: "#6B7280",
  },
  newsSummarySmall: {
    fontSize: 10,
    color: "#6B7280",
    lineHeight: 14,
  },
  newsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  newsDetailCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
  },
  newsContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
  },
  adCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  adSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 16,
  },
  adButton: {
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  adButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
})
