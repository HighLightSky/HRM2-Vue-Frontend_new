<template>
  <div class="home-view">
    <el-container>
      <el-header>
        <h1>HRM2 人力资源管理系统</h1>
      </el-header>
      <el-main>
        <el-card>
          <template #header>
            <span>欢迎使用</span>
          </template>
          <p>这是一个基于 Vue 3 + TypeScript + Element Plus 的人力资源管理系统前端项目。</p>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.home-view {
  padding: 20px;
}

.el-header {
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.el-header h1 {
  margin: 0;
  font-size: 24px;
}

.el-main {
  padding: 20px;
}

.el-card {
  max-width: 600px;
  margin: 0 auto;
}
</style>
