# components/AGENTS.md

## 개요
항상 shadcn/ui 에서 제공하는 컴포넌트를 우선적으로 검토하여 사용합니다.
적절한 컴포넌트가 설치되어 있지 않다면 직접 설치해서 사용하세요.

## 스타일링
- TailwindCSS 유틸리티로 신속 개발.
- 주요 섹션은 별도 컴포넌트로 분리.
- flex가 필요한 아이템은 항상 shadcn의 Item 컴포넌트를 사용합니다.

## 디자인 시스템
- shadcn/ui를 기본으로 따르고, 변경 시 이유를 명확히 기록한다.

## 네이밍
- 파일명 kebab-case, 컴포넌트 PascalCase.
- 모든 커스텀 훅은 use로 시작한다.
