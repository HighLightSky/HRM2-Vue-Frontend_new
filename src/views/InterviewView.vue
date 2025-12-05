<template>
  <div class="interview-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">面试辅助系统</h1>
        <p class="page-desc">AI 辅助生成面试问题，实时评估候选人回答</p>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="content-grid">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <!-- 候选人选择 -->
        <CandidateSelector
          :positions="positionsList"
          v-model:selected-position-id="selectedPositionId"
          v-model:selected-resume-id="selectedResumeId"
          @select="selectCandidate"
        />

        <!-- 面试配置 -->
        <el-card class="config-card" shadow="hover">
          <template #header>
            <span class="card-title">面试配置</span>
          </template>
          <div class="config-content">
            <div class="config-item">
              <span class="label">问题数量:</span>
              <el-input-number v-model="questionCount" :min="3" :max="20" size="small" />
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧面板 - 面试区域 -->
      <div class="right-panel">
        <InterviewQuestionList
          :questions="questions"
          :current-index="currentQuestionIndex"
          :summary="interviewSummary"
          :overall-score="overallScore"
          :can-generate="!!selectedResume"
          :is-generating="isGenerating"
          @generate="handleGenerateQuestions"
          @export="handleExportReport"
          @submit="handleSubmitInterview"
          @update:current-index="currentQuestionIndex = $event"
          @update:summary="interviewSummary = $event"
          @update:overall-score="overallScore = $event"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 组件导入
import { InterviewQuestionList, CandidateSelector } from '@/components/interview'

// Composables
import { useInterviewQuestions } from '@/composables/useInterviewQuestions'

// API 和类型
import { positionApi } from '@/api'
import type { PositionData, ResumeData } from '@/types'

// ========== 岗位和候选人选择 ==========
const positionsList = ref<PositionData[]>([])
const selectedPositionId = ref<string | null>(null)
const selectedResumeId = ref<string | null>(null)
const selectedResume = ref<ResumeData | null>(null)

// 计算当前选中的岗位
const selectedPosition = computed(() => {
  if (!selectedPositionId.value) return null
  return positionsList.value.find(p => p.id === selectedPositionId.value) || null
})

// 加载岗位列表
const loadPositionsList = async () => {
  try {
    const result = await positionApi.getPositions({ include_resumes: true })
    positionsList.value = result.positions || []
  } catch (err) {
    console.error('加载岗位列表失败:', err)
  }
}

// 选择候选人
const selectCandidate = (resume: ResumeData) => {
  selectedResume.value = resume
  // 重置面试数据
  resetInterview()
}

// ========== 面试问题管理 ==========
const questionCount = ref(5)

const {
  questions,
  currentQuestionIndex,
  isGenerating,
  interviewSummary,
  overallScore,
  generateQuestions,
  resetInterview,
  exportReport,
  submitInterview
} = useInterviewQuestions()

// 生成问题
const handleGenerateQuestions = () => {
  generateQuestions(selectedPosition.value, questionCount.value)
}

// 导出报告
const handleExportReport = () => {
  exportReport(
    selectedResume.value?.candidate_name || '',
    selectedResume.value?.position_title || ''
  )
}

// 提交面试结果
const handleSubmitInterview = () => {
  submitInterview()
}

// ========== 生命周期 ==========
onMounted(() => {
  loadPositionsList()
})
</script>

<style scoped lang="scss">
.interview-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  .page-title {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }

  .page-desc {
    margin: 0;
    font-size: 14px;
    color: #909399;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  align-items: start;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

// 左侧面板
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 面试配置卡片
.config-card {
  .config-content {
    .config-item {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .label {
        font-size: 13px;
        color: #606266;
      }
    }
  }
}

// 右侧面板
.right-panel {
  min-height: 400px;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
