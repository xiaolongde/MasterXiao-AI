#!/bin/bash

# ==================== 一键部署脚本 ====================
# 用法: ./deploy.sh 或 bash deploy.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
APP_NAME="masterxiao-ai"
PROJECT_DIR=$(cd "$(dirname "$0")" && pwd)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   MasterXiao-AI 一键部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd "$PROJECT_DIR"

# 1. 拉取最新代码
echo -e "${YELLOW}[1/5] 拉取最新代码...${NC}"
git fetch --all
git reset --hard origin/main 2>/dev/null || git reset --hard origin/master
git pull
echo -e "${GREEN}✓ 代码已更新${NC}"
echo ""

# 2. 安装依赖
echo -e "${YELLOW}[2/5] 安装依赖...${NC}"
npm install --production=false
echo -e "${GREEN}✓ 依赖已安装${NC}"
echo ""

# 3. 构建前端
echo -e "${YELLOW}[3/5] 构建前端...${NC}"
npm run build
echo -e "${GREEN}✓ 前端构建完成${NC}"
echo ""

# 4. 重启服务
echo -e "${YELLOW}[4/5] 重启服务...${NC}"
if pm2 list | grep -q "$APP_NAME"; then
    echo "检测到已有服务运行，正在重启..."
    pm2 restart "$APP_NAME"
else
    echo "首次启动服务..."
    NODE_ENV=production pm2 start server/index.js --name "$APP_NAME"
fi
echo -e "${GREEN}✓ 服务已启动${NC}"
echo ""

# 5. 保存 PM2 配置（开机自启）
echo -e "${YELLOW}[5/5] 保存 PM2 配置...${NC}"
pm2 save
echo -e "${GREEN}✓ PM2 配置已保存${NC}"
echo ""

# 显示服务状态
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   部署完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
pm2 status "$APP_NAME"
echo ""
echo -e "访问地址: ${GREEN}http://$(hostname -I | awk '{print $1}'):3000${NC}"
echo -e "查看日志: ${YELLOW}pm2 logs $APP_NAME${NC}"
echo ""
