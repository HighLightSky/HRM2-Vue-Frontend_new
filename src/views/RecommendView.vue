<template>
  <div class="recommend-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon><TrophyBase /></el-icon>
        </div>
        <div class="header-text">
          <h1 class="page-title">综合分析决策平台</h1>
          <p class="page-desc">整合简历、初筛报告、面试记录，AI智能生成最终录用建议</p>
        </div>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-value">{{ positionsList.length }}</span>
          <span class="stat-label">岗位</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ totalCandidates }}</span>
          <span class="stat-label">候选人</span>
        </div>
        <div class="stat-item highlight">
          <span class="stat-value">{{ analyzedCount }}</span>
          <span class="stat-label">已分析</span>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="content-grid">
      <!-- 左侧面板：岗位列表 -->
      <div class="left-panel">
        <div class="panel-header">
          <h3>招聘岗位</h3>
          <el-button size="small" text type="primary" @click="goToScreening">
            <el-icon><Plus /></el-icon>
            添加候选人
          </el-button>
        </div>
        <div class="position-list">
          <div
            v-for="pos in positionsList"
            :key="pos.id"
            class="position-item"
            :class="{ 'active': selectedPositionId === pos.id }"
            @click="selectPosition(pos)"
          >
            <div class="position-info">
              <span class="position-name">{{ pos.position }}</span>
              <span class="position-count">{{ pos.resumes?.length || 0 }} 人</span>
            </div>
            <div class="position-progress">
              <div 
                class="progress-bar" 
                :style="{ width: getPositionAnalyzedPercent(pos) + '%' }"
              ></div>
            </div>
          </div>
          <div v-if="positionsList.length === 0" class="empty-positions">
            <el-empty description="暂无岗位" :image-size="60" />
          </div>
        </div>
      </div>

      <!-- 右侧面板：候选人分析卡片 -->
      <div class="right-panel">
        <div v-if="!selectedPositionId" class="empty-state">
          <el-empty description="请选择左侧岗位查看候选人" :image-size="120" />
        </div>
        
        <div v-else-if="currentResumes.length === 0" class="empty-state">
          <el-empty description="该岗位暂无候选人">
            <el-button type="primary" @click="goToScreening">添加候选人</el-button>
          </el-empty>
        </div>
        
        <div v-else class="candidates-container">
          <div class="panel-header">
            <h3>候选人综合分析</h3>
            <span class="candidate-count">共 {{ currentResumes.length }} 人</span>
          </div>
          
          <div class="candidates-list">
            <CandidateAnalysisCard
              v-for="resume in currentResumes"
              :key="resume.id"
              :resume="resume"
              :interview-session="getInterviewSession(resume.id)"
              :final-recommendation="getFinalRecommendation(resume.id)"
              :is-analyzing="isAnalyzingResume(resume.id)"
              :analysis-progress="getAnalysisProgress(resume.id)"
              :analysis-status-text="getAnalysisStatusText(resume.id)"
              @view-resume="viewResumeDetail(resume)"
              @view-screening-report="viewScreeningReport(resume)"
              @view-interview-records="viewInterviewRecords(resume)"
              @view-interview-report="viewInterviewReport(resume)"
              @view-final-report="viewFinalReport(resume)"
              @go-to-screening="goToScreening"
              @go-to-interview="goToInterview(resume)"
              @start-analysis="startCandidateAnalysis(resume)"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 面试记录查看对话框 -->
    <el-dialog
      v-model="showInterviewDialog"
      title="面试问答记录"
      width="700px"
      destroy-on-close
    >
      <div v-if="selectedInterviewSession" class="interview-records">
        <div 
          v-for="(qa, index) in selectedInterviewSession.qa_records" 
          :key="index"
          class="qa-item"
        >
          <div class="qa-question">
            <span class="qa-label">Q{{ index + 1 }}:</span>
            <span>{{ qa.question }}</span>
          </div>
          <div class="qa-answer">
            <span class="qa-label">A:</span>
            <span>{{ qa.answer }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showInterviewDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 面试报告查看对话框 -->
    <el-dialog
      v-model="showInterviewReportDialog"
      title="面试分析报告"
      width="600px"
      destroy-on-close
    >
      <div v-if="selectedInterviewReport" class="interview-report">
        <div class="report-header">
          <div class="report-score" :class="getReportScoreClass(selectedInterviewReport)">
            <span class="score-value">{{ selectedInterviewReport.overall_assessment?.recommendation_score }}</span>
            <span class="score-label">分</span>
          </div>
          <div class="report-recommendation">
            {{ selectedInterviewReport.overall_assessment?.recommendation }}
          </div>
        </div>
        <div class="report-summary">
          <h4>评估总结</h4>
          <p>{{ selectedInterviewReport.overall_assessment?.summary }}</p>
        </div>
        <div v-if="selectedInterviewReport.highlights?.length" class="report-section">
          <h4>亮点</h4>
          <ul>
            <li v-for="(item, i) in selectedInterviewReport.highlights" :key="i">{{ item }}</li>
          </ul>
        </div>
        <div v-if="selectedInterviewReport.red_flags?.length" class="report-section warning">
          <h4>需关注</h4>
          <ul>
            <li v-for="(item, i) in selectedInterviewReport.red_flags" :key="i">{{ item }}</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="showInterviewReportDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { TrophyBase, Plus } from '@element-plus/icons-vue'

// 组件导入
import { CandidateAnalysisCard } from '@/components/recommend'

// API 和类型
import { positionApi, interviewAssistApi } from '@/api'
import type { PositionData, ResumeData } from '@/types'

const router = useRouter()

// ========== 类型定义 ==========
interface InterviewSession {
  id: string
  resume_data_id: string
  qa_records: Array<{ question: string; answer: string }>
  final_report?: {
    overall_assessment?: {
      recommendation_score: number
      recommendation: string
      summary: string
    }
    highlights?: string[]
    red_flags?: string[]
  }
}

interface FinalRecommendation {
  score: number
  recommendation: string
  summary: string
}

// ========== 岗位管理 ==========
const positionsList = ref<PositionData[]>([])
const selectedPositionId = ref<string | null>(null)

// 当前选中岗位的简历
const currentResumes = computed(() => {
  if (!selectedPositionId.value) return []
  const pos = positionsList.value.find(p => p.id === selectedPositionId.value)
  return pos?.resumes || []
})

// 统计数据
const totalCandidates = computed(() => {
  return positionsList.value.reduce((sum, pos) => sum + (pos.resumes?.length || 0), 0)
})

const analyzedCount = computed(() => {
  return Object.keys(finalRecommendations.value).length
})

// 加载岗位列表
const loadPositionsList = async () => {
  try {
    const result = await positionApi.getPositions({ include_resumes: true })
    positionsList.value = (result.positions || []).map(p => ({ ...p, showAll: false }))
    
    // 默认选中第一个
    const firstPosition = positionsList.value[0]
    if (firstPosition && !selectedPositionId.value) {
      selectedPositionId.value = firstPosition.id ?? null
    }
    
    // 加载所有简历的面试会话
    await loadAllInterviewSessions()
  } catch (err) {
    console.error('加载岗位列表失败:', err)
  }
}

// 选择岗位
const selectPosition = (pos: PositionData) => {
  selectedPositionId.value = pos.id || null
}

// 获取岗位已分析百分比
const getPositionAnalyzedPercent = (pos: PositionData) => {
  const resumes = pos.resumes || []
  if (resumes.length === 0) return 0
  const analyzed = resumes.filter(r => finalRecommendations.value[r.id!]).length
  return Math.round((analyzed / resumes.length) * 100)
}

// 跳转到简历初筛
const goToScreening = () => {
  router.push('/screening')
}

// 跳转到面试
const goToInterview = (resume: ResumeData) => {
  router.push('/interview')
}

// ========== 面试会话管理 ==========
const interviewSessions = ref<Record<string, InterviewSession>>({})
const finalRecommendations = ref<Record<string, FinalRecommendation>>({})
const analyzingResumes = ref<Set<string>>(new Set())
const analysisProgress = ref<Record<string, number>>({})
const analysisStatusTexts = ref<Record<string, string>>({})

// 加载所有简历的面试会话
const loadAllInterviewSessions = async () => {
  const allResumes = positionsList.value.flatMap(p => p.resumes || [])
  
  for (const resume of allResumes) {
    if (!resume.id) continue
    try {
      // 查询该简历关联的面试会话
      const sessions = await interviewAssistApi.getSessionsByResumeId(resume.id)
      if (sessions && sessions.length > 0) {
        // 取最新的会话
        const latestSession = sessions[0] as InterviewSession
        interviewSessions.value[resume.id] = latestSession
      }
    } catch (err) {
      // 静默处理，可能没有面试记录
    }
  }
}

// 获取面试会话
const getInterviewSession = (resumeId: string) => {
  return interviewSessions.value[resumeId] || null
}

// 获取最终推荐
const getFinalRecommendation = (resumeId: string) => {
  return finalRecommendations.value[resumeId] || null
}

// 是否正在分析
const isAnalyzingResume = (resumeId: string) => {
  return analyzingResumes.value.has(resumeId)
}

// 获取分析进度
const getAnalysisProgress = (resumeId: string) => {
  return analysisProgress.value[resumeId] || 0
}

// 获取分析状态文本
const getAnalysisStatusText = (resumeId: string) => {
  return analysisStatusTexts.value[resumeId] || ''
}

// ========== 综合分析 ==========
const startCandidateAnalysis = async (resume: ResumeData) => {
  if (!resume.id) return
  
  analyzingResumes.value.add(resume.id)
  analysisProgress.value[resume.id] = 10
  analysisStatusTexts.value[resume.id] = '正在收集数据...'
  
  try {
    // 模拟分析过程（后续接入真实的综合分析 Agent）
    analysisProgress.value[resume.id] = 30
    analysisStatusTexts.value[resume.id] = '分析简历内容...'
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    analysisProgress.value[resume.id] = 50
    analysisStatusTexts.value[resume.id] = '分析初筛结果...'
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    analysisProgress.value[resume.id] = 70
    analysisStatusTexts.value[resume.id] = '分析面试表现...'
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    analysisProgress.value[resume.id] = 90
    analysisStatusTexts.value[resume.id] = '生成综合建议...'
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // TODO: 调用后端综合分析 API
    // const result = await recommendApi.analyzeCandidateFinal(resume.id)
    
    // 临时模拟结果
    const session = interviewSessions.value[resume.id]
    const screeningScore = resume.screening_score?.comprehensive_score || 60
    const interviewScore = session?.final_report?.overall_assessment?.recommendation_score || 60
    const finalScore = Math.round((screeningScore + interviewScore) / 2)
    
    let recommendation = '待定'
    if (finalScore >= 80) recommendation = '强烈推荐'
    else if (finalScore >= 65) recommendation = '推荐录用'
    else if (finalScore >= 50) recommendation = '谨慎考虑'
    else recommendation = '不推荐'
    
    finalRecommendations.value[resume.id] = {
      score: finalScore,
      recommendation,
      summary: `综合简历初筛(${screeningScore}分)和面试表现(${interviewScore}分)，该候选人整体评分为${finalScore}分。${recommendation === '强烈推荐' ? '建议优先安排后续流程。' : recommendation === '推荐录用' ? '符合岗位基本要求。' : '需进一步评估。'}`
    }
    
    analysisProgress.value[resume.id] = 100
    analysisStatusTexts.value[resume.id] = '分析完成'
    ElMessage.success('综合分析完成')
    
  } catch (err) {
    console.error('综合分析失败:', err)
    ElMessage.error('综合分析失败')
  } finally {
    analyzingResumes.value.delete(resume.id)
  }
}

// ========== 对话框 ==========
const showInterviewDialog = ref(false)
const showInterviewReportDialog = ref(false)
const selectedInterviewSession = ref<InterviewSession | null>(null)
const selectedInterviewReport = ref<InterviewSession['final_report'] | null>(null)

// 查看简历详情
const viewResumeDetail = (resume: ResumeData) => {
  console.log('查看简历:', resume)
  // 可以打开详情对话框
}

// 查看初筛报告
const viewScreeningReport = (resume: ResumeData) => {
  const url = resume.report_md_url
  if (url) {
    window.open(url, '_blank')
  } else {
    ElMessage.warning('暂无初筛报告')
  }
}

// 查看面试记录
const viewInterviewRecords = (resume: ResumeData) => {
  if (!resume.id) return
  const session = interviewSessions.value[resume.id]
  if (session) {
    selectedInterviewSession.value = session
    showInterviewDialog.value = true
  } else {
    ElMessage.warning('暂无面试记录')
  }
}

// 查看面试报告
const viewInterviewReport = (resume: ResumeData) => {
  if (!resume.id) return
  const session = interviewSessions.value[resume.id]
  if (session?.final_report) {
    selectedInterviewReport.value = session.final_report
    showInterviewReportDialog.value = true
  } else {
    ElMessage.warning('暂无面试报告')
  }
}

// 查看最终报告
const viewFinalReport = (resume: ResumeData) => {
  if (!resume.id) return
  const recommendation = finalRecommendations.value[resume.id]
  if (recommendation) {
    ElMessage.info(`综合评分: ${recommendation.score}分 - ${recommendation.recommendation}`)
  }
}

// 获取报告分数样式
const getReportScoreClass = (report: InterviewSession['final_report']) => {
  const score = report?.overall_assessment?.recommendation_score || 0
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

// ========== 生命周期 ==========
onMounted(() => {
  loadPositionsList()
})
</script>

<style scoped lang="scss">
.recommend-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: white;
  
  .header-content {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .header-icon {
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .el-icon {
        font-size: 28px;
      }
    }
    
    .header-text {
      .page-title {
        margin: 0 0 4px;
        font-size: 24px;
        font-weight: 700;
      }
      
      .page-desc {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
      }
    }
  }
  
  .header-stats {
    display: flex;
    gap: 32px;
    
    .stat-item {
      text-align: center;
      
      .stat-value {
        display: block;
        font-size: 28px;
        font-weight: 700;
      }
      
      .stat-label {
        font-size: 13px;
        opacity: 0.8;
      }
      
      &.highlight {
        .stat-value {
          color: #fbbf24;
        }
      }
    }
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}

// 左侧面板
.left-panel {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
    }
  }
  
  .position-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .position-item {
    padding: 14px 16px;
    background: #f9fafb;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
    
    &:hover {
      background: #f3f4f6;
    }
    
    &.active {
      background: linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%);
      border-color: #667eea;
    }
    
    .position-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .position-name {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }
      
      .position-count {
        font-size: 12px;
        color: #6b7280;
        background: #e5e7eb;
        padding: 2px 8px;
        border-radius: 10px;
      }
    }
    
    .position-progress {
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
      
      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        border-radius: 2px;
        transition: width 0.3s;
      }
    }
  }
  
  .empty-positions {
    padding: 20px 0;
  }
}

// 右侧面板
.right-panel {
  min-height: 500px;
  
  .empty-state {
    background: white;
    border-radius: 16px;
    padding: 60px 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
  
  .candidates-container {
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1a1a2e;
      }
      
      .candidate-count {
        font-size: 14px;
        color: #6b7280;
      }
    }
    
    .candidates-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  }
}

// 对话框样式
.interview-records {
  max-height: 500px;
  overflow-y: auto;
  
  .qa-item {
    padding: 16px;
    background: #f9fafb;
    border-radius: 12px;
    margin-bottom: 12px;
    
    .qa-question {
      margin-bottom: 12px;
      font-weight: 500;
      color: #374151;
      
      .qa-label {
        color: #667eea;
        font-weight: 600;
        margin-right: 8px;
      }
    }
    
    .qa-answer {
      color: #6b7280;
      line-height: 1.6;
      
      .qa-label {
        color: #10b981;
        font-weight: 600;
        margin-right: 8px;
      }
    }
  }
}

.interview-report {
  .report-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
    
    .report-score {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      
      &.score-high {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
      }
      &.score-medium {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }
      &.score-low {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
      }
      
      .score-value {
        font-size: 24px;
        font-weight: 700;
      }
      
      .score-label {
        font-size: 12px;
        opacity: 0.9;
      }
    }
    
    .report-recommendation {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a2e;
    }
  }
  
  .report-summary {
    margin-bottom: 20px;
    
    h4 {
      margin: 0 0 8px;
      font-size: 14px;
      color: #6b7280;
    }
    
    p {
      margin: 0;
      font-size: 14px;
      color: #374151;
      line-height: 1.6;
    }
  }
  
  .report-section {
    margin-bottom: 16px;
    
    h4 {
      margin: 0 0 8px;
      font-size: 14px;
      color: #10b981;
    }
    
    &.warning h4 {
      color: #f59e0b;
    }
    
    ul {
      margin: 0;
      padding-left: 20px;
      
      li {
        font-size: 13px;
        color: #374151;
        margin-bottom: 4px;
      }
    }
  }
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
    
    .header-content {
      flex-direction: column;
    }
  }
}
</style>
