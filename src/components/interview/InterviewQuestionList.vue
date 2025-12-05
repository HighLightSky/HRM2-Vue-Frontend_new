<template>
  <el-card class="interview-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-title">面试问答</span>
        <div class="header-actions">
          <el-button
            type="primary"
            :disabled="!canGenerate || isGenerating"
            :loading="isGenerating"
            @click="$emit('generate')"
          >
            {{ isGenerating ? '生成中...' : '生成面试题' }}
          </el-button>
          <el-button
            v-if="questions.length > 0"
            type="success"
            @click="$emit('export')"
          >
            导出报告
          </el-button>
        </div>
      </div>
    </template>

    <!-- 空状态 -->
    <div v-if="!canGenerate" class="empty-state">
      <el-empty description="请先选择候选人" :image-size="100" />
    </div>

    <div v-else-if="questions.length === 0" class="empty-state">
      <el-empty description="点击「生成面试题」开始面试" :image-size="100" />
    </div>

    <!-- 问题列表 -->
    <div v-else class="questions-list">
      <div
        v-for="(question, index) in questions"
        :key="index"
        class="question-item"
        :class="{ 'is-current': currentIndex === index }"
      >
        <div class="question-header">
          <span class="question-number">问题 {{ index + 1 }}</span>
          <el-tag :type="getCategoryType(question.category)" size="small">
            {{ question.category }}
          </el-tag>
          <el-rate
            v-model="question.difficulty"
            disabled
            :max="5"
            size="small"
            class="difficulty-rate"
          />
        </div>

        <div class="question-content">
          <p class="question-text">{{ question.question }}</p>
          <div v-if="question.expected_skills?.length" class="expected-skills">
            <span class="label">考察技能:</span>
            <el-tag v-for="skill in question.expected_skills" :key="skill" size="small" type="info">
              {{ skill }}
            </el-tag>
          </div>
        </div>

        <!-- 回答区域 -->
        <div class="answer-section">
          <el-input
            v-model="question.answer"
            type="textarea"
            :rows="3"
            placeholder="记录候选人回答..."
            @focus="$emit('update:currentIndex', index)"
          />
          
          <!-- 评分区域 -->
          <div class="evaluation-section">
            <div class="eval-item">
              <span class="label">回答评分:</span>
              <el-rate v-model="question.score" :max="5" />
            </div>
            <el-input
              v-model="question.comment"
              placeholder="评价备注"
              size="small"
              style="margin-top: 8px"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 面试总结 -->
    <div v-if="questions.length > 0" class="interview-summary">
      <h4>面试总结</h4>
      <el-input
        :model-value="summary"
        type="textarea"
        :rows="4"
        placeholder="填写面试总体评价和建议..."
        @update:model-value="$emit('update:summary', $event)"
      />
      <div class="summary-actions">
        <div class="overall-score">
          <span>总体评分:</span>
          <el-rate 
            :model-value="overallScore" 
            :max="5" 
            size="large"
            @update:model-value="$emit('update:overallScore', $event)"
          />
        </div>
        <el-button type="primary" @click="$emit('submit')">
          提交面试结果
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
export interface InterviewQuestion {
  question: string
  category: string
  difficulty: number
  expected_skills: string[]
  answer: string
  score: number
  comment: string
}

const props = defineProps<{
  questions: InterviewQuestion[]
  currentIndex: number
  summary: string
  overallScore: number
  canGenerate: boolean
  isGenerating: boolean
}>()

defineEmits<{
  generate: []
  export: []
  submit: []
  'update:currentIndex': [index: number]
  'update:summary': [value: string]
  'update:overallScore': [value: number]
}>()

// 获取分类标签类型
const getCategoryType = (category: string) => {
  const types: Record<string, string> = {
    '技术能力': 'primary',
    '项目经验': 'success',
    '团队协作': 'warning',
    '问题解决': 'danger',
    '职业规划': 'info'
  }
  return types[category] || 'info'
}
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  padding: 40px 0;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 3px solid #e4e7ed;
  transition: all 0.2s;

  &.is-current {
    border-left-color: #409eff;
    background: #ecf5ff;
  }
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .question-number {
    font-weight: 600;
    color: #303133;
  }

  .difficulty-rate {
    margin-left: auto;
  }
}

.question-content {
  margin-bottom: 12px;

  .question-text {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: #303133;
    line-height: 1.6;
  }

  .expected-skills {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .label {
      font-size: 12px;
      color: #909399;
    }
  }
}

.answer-section {
  margin-top: 12px;
}

.evaluation-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;

  .eval-item {
    display: flex;
    align-items: center;
    gap: 12px;

    .label {
      font-size: 13px;
      color: #606266;
    }
  }
}

.interview-summary {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;

  h4 {
    margin: 0 0 12px 0;
    font-size: 15px;
    color: #303133;
  }
}

.summary-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;

  .overall-score {
    display: flex;
    align-items: center;
    gap: 12px;

    span {
      font-size: 14px;
      color: #606266;
    }
  }
}
</style>
