/**
 * 面试问题生成和管理 composable
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { PositionData } from '@/types'

export interface InterviewQuestion {
  question: string
  category: string
  difficulty: number
  expected_skills: string[]
  answer: string
  score: number
  comment: string
}

export function useInterviewQuestions() {
  const questions = ref<InterviewQuestion[]>([])
  const currentQuestionIndex = ref(0)
  const isGenerating = ref(false)
  const interviewSummary = ref('')
  const overallScore = ref(0)

  // 问题模板
  const questionTemplates: Record<string, string[]> = {
    '技术能力': [
      '请介绍一下您对 {skill} 的理解和实际应用经验？',
      '在使用 {skill} 时，您遇到过哪些挑战？如何解决的？',
      '请解释一下 {skill} 的核心原理？'
    ],
    '项目经验': [
      '请介绍一个您最引以为傲的项目，您在其中担任什么角色？',
      '在项目中遇到最大的技术挑战是什么？您是如何克服的？',
      '请描述一个您主导的技术方案设计过程？'
    ],
    '团队协作': [
      '您如何与团队成员进行有效沟通和协作？',
      '当团队意见不一致时，您通常如何处理？',
      '请举例说明您如何帮助团队成员成长？'
    ],
    '问题解决': [
      '遇到复杂问题时，您的分析思路是什么？',
      '请描述一次您快速定位并解决生产问题的经历？',
      '如何平衡项目进度和代码质量？'
    ],
    '职业规划': [
      '您未来3-5年的职业规划是什么？',
      '为什么选择加入我们公司？',
      '您期望在新岗位上获得什么样的成长？'
    ]
  }

  const categories = ['技术能力', '项目经验', '团队协作', '问题解决', '职业规划']

  // 生成单个问题
  const generateSingleQuestion = (category: string, skills: string[]): string => {
    const templates = questionTemplates[category] ?? questionTemplates['技术能力']!
    const template = templates[Math.floor(Math.random() * templates.length)] ?? ''
    const skill = skills[0] || '相关技术'
    return template.replace('{skill}', skill)
  }

  // 生成面试问题
  const generateQuestions = async (positionData: PositionData | null, questionCount: number) => {
    if (!positionData) return

    isGenerating.value = true
    try {
      // 模拟 API 调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500))

      const skills = positionData.required_skills || []

      questions.value = Array.from({ length: questionCount }, (_, i) => {
        const category = categories[i % categories.length]!
        return {
          question: generateSingleQuestion(category, skills),
          category,
          difficulty: Math.floor(Math.random() * 3) + 2,
          expected_skills: skills.slice(0, 2),
          answer: '',
          score: 0,
          comment: ''
        }
      })

      currentQuestionIndex.value = 0
      ElMessage.success('面试题已生成')
    } catch (err) {
      console.error('生成面试题失败:', err)
      ElMessage.error('生成面试题失败')
    } finally {
      isGenerating.value = false
    }
  }

  // 重置面试数据
  const resetInterview = () => {
    questions.value = []
    currentQuestionIndex.value = 0
    interviewSummary.value = ''
    overallScore.value = 0
  }

  // 导出报告
  const exportReport = (candidateName: string, positionTitle: string) => {
    const report = {
      candidate: candidateName,
      position: positionTitle,
      questions: questions.value,
      summary: interviewSummary.value,
      overallScore: overallScore.value,
      date: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview_report_${candidateName || 'unknown'}.json`
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('报告已导出')
  }

  // 提交面试结果
  const submitInterview = () => {
    if (!interviewSummary.value) {
      ElMessage.warning('请填写面试总结')
      return false
    }
    if (overallScore.value === 0) {
      ElMessage.warning('请给出总体评分')
      return false
    }

    // 实际应调用后端 API 保存面试结果
    ElMessage.success('面试结果已提交')
    return true
  }

  return {
    questions,
    currentQuestionIndex,
    isGenerating,
    interviewSummary,
    overallScore,
    generateQuestions,
    resetInterview,
    exportReport,
    submitInterview
  }
}
