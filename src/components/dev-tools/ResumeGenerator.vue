<template>
  <el-card class="resume-generator" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-title">
          <el-icon><MagicStick /></el-icon>
          随机简历生成器
        </span>
        <el-tag type="warning" size="small">开发测试用</el-tag>
      </div>
    </template>

    <el-form :model="formData" label-width="100px" label-position="left">
      <!-- 岗位选择 -->
      <el-form-item label="选择岗位" required>
        <el-select
          v-model="selectedPositionId"
          placeholder="请选择目标岗位"
          style="width: 100%"
          @change="handlePositionChange"
        >
          <el-option
            v-for="pos in positions"
            :key="pos.id"
            :label="pos.position"
            :value="pos.id"
          >
            <div class="position-option">
              <span>{{ pos.position }}</span>
              <span class="position-skills">
                {{ pos.required_skills?.slice(0, 3).join(', ') }}
                {{ pos.required_skills?.length > 3 ? '...' : '' }}
              </span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 岗位信息预览 -->
      <el-form-item v-if="selectedPosition" label="岗位信息">
        <div class="position-preview">
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="岗位名称">
              {{ selectedPosition.position }}
            </el-descriptions-item>
            <el-descriptions-item label="岗位描述">
              {{ selectedPosition.description || '暂无描述' }}
            </el-descriptions-item>
            <el-descriptions-item label="必备技能">
              <el-tag 
                v-for="skill in selectedPosition.required_skills" 
                :key="skill" 
                size="small" 
                style="margin-right: 4px; margin-bottom: 4px;"
              >
                {{ skill }}
              </el-tag>
              <span v-if="!selectedPosition.required_skills?.length" class="text-muted">暂无</span>
            </el-descriptions-item>
            <el-descriptions-item label="最低经验">
              {{ selectedPosition.min_experience || 0 }} 年
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-form-item>

      <!-- 生成数量 -->
      <el-form-item label="生成数量">
        <el-slider
          v-model="formData.count"
          :min="1"
          :max="20"
          :step="1"
          show-input
          :show-input-controls="false"
          style="padding-right: 60px;"
        />
        <span class="count-hint">每份简历将单独调用LLM生成，数量越多耗时越长</span>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button
          type="primary"
          :loading="generating"
          :disabled="!selectedPositionId"
          @click="handleGenerate"
        >
          <el-icon v-if="!generating"><MagicStick /></el-icon>
          {{ generating ? '生成中...' : '开始生成' }}
        </el-button>
        <span v-if="generating" class="generating-hint">
          正在批量生成 {{ formData.count }} 份简历，每份约需 3-5 秒...
        </span>
      </el-form-item>
    </el-form>

    <!-- 生成结果 -->
    <div v-if="lastResult" class="generate-result">
      <el-divider content-position="left">生成结果</el-divider>
      <el-result
        :icon="lastResult.added_count > 0 ? 'success' : 'warning'"
        :title="`成功生成 ${lastResult.added_count} 份简历`"
        :sub-title="`请求生成 ${lastResult.requested_count} 份，跳过 ${lastResult.skipped_count} 份`"
      >
        <template #extra>
          <el-button type="primary" @click="goToLibrary">
            前往简历库查看
          </el-button>
        </template>
      </el-result>

      <!-- 生成的简历列表 -->
      <div v-if="lastResult.added.length > 0" class="added-list">
        <h4>已添加的简历：</h4>
        <el-tag
          v-for="item in lastResult.added"
          :key="item.id"
          type="success"
          style="margin: 4px;"
        >
          {{ item.candidate_name }}
        </el-tag>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import { positionApi, devToolsApi } from '@/api'
import type { PositionData } from '@/types'

// 岗位列表
const positions = ref<PositionData[]>([])
const selectedPositionId = ref<string>('')
const selectedPosition = ref<PositionData | null>(null)

// 表单数据
const formData = reactive({
  count: 5
})

// 生成状态
const generating = ref(false)
const lastResult = ref<{
  added: Array<{ id: string; filename: string; candidate_name: string }>
  skipped: Array<{ filename: string; reason: string }>
  added_count: number
  skipped_count: number
  requested_count: number
} | null>(null)

const router = useRouter()

// 加载岗位列表
const loadPositions = async () => {
  try {
    const result = await positionApi.getPositions()
    positions.value = result.positions
  } catch (error) {
    console.error('加载岗位列表失败:', error)
    ElMessage.error('加载岗位列表失败')
  }
}

// 岗位选择变化
const handlePositionChange = (posId: string) => {
  selectedPosition.value = positions.value.find(p => p.id === posId) || null
}

// 生成简历
const handleGenerate = async () => {
  if (!selectedPosition.value) {
    ElMessage.warning('请先选择岗位')
    return
  }

  generating.value = true
  lastResult.value = null

  try {
    const result = await devToolsApi.generateResumes({
      position: {
        position: selectedPosition.value.position,
        description: selectedPosition.value.description,
        required_skills: selectedPosition.value.required_skills,
        optional_skills: selectedPosition.value.optional_skills,
        min_experience: selectedPosition.value.min_experience,
        education: selectedPosition.value.education
      },
      count: formData.count
    })

    lastResult.value = result

    if (result.added_count > 0) {
      ElMessage.success(`成功生成 ${result.added_count} 份简历`)
    } else {
      ElMessage.warning('未能生成任何简历')
    }
  } catch (error: any) {
    console.error('生成简历失败:', error)
    ElMessage.error(error.message || '生成简历失败')
  } finally {
    generating.value = false
  }
}

// 前往简历库
const goToLibrary = () => {
  router.push('/library')
}

onMounted(() => {
  loadPositions()
})
</script>

<style scoped lang="scss">
.resume-generator {
  max-width: 800px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.position-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .position-skills {
    font-size: 12px;
    color: #909399;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.position-preview {
  width: 100%;
  
  :deep(.el-descriptions) {
    margin-top: 0;
  }
}

.text-muted {
  color: #909399;
  font-size: 12px;
}

.count-hint {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.generating-hint {
  margin-left: 12px;
  color: #e6a23c;
  font-size: 13px;
}

.generate-result {
  margin-top: 20px;

  .added-list {
    margin-top: 16px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 8px;

    h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #606266;
    }
  }
}
</style>
