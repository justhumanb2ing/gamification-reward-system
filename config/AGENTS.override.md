# config/AGENTS.override.md

## 목표
Supabase 데이터베이스 스키마 변경(컬럼/타입/구조)이 API 응답 및 프론트엔드 타입 정의에 자동으로 반영될 수 있도록, 데이터 일관성과 타입 안정성을 유지한다.

## 적용 범위
Supabase 스키마 변경 시에만 전체 자동화 파이프라인을 수행한다. 변경이 없으면 SQL·push.sh·명령어 안내를 생성하지 않는다.

## 작업 플로우
1) Supabase SQL Migration: supabase/migrations/에 YYYYMMDD_HHMM_description.sql, 변경 내용+RLS 포함.
2) push.sh 자동 관리: 없으면 생성, 있으면 업데이트.
   - supabase db push
   - supabase gen types typescript --local > types/database.types.ts
3) Type Impact 분석: 변경 타입 설명과 gen types 이후 변화 기술.
4) Frontend Impact & Code: 영향받는 경로, Server Component 중심 코드(빈/에러/로딩 포함).
5) 문서(.md) 생성: docs/YYYYMMDD_<feature>.md.
6) Required Commands: 스키마 변경이 있을 때만 “sh push.sh” 안내.

## 출력 형식(반드시 유지)
## 1. Supabase SQL Migration
## 2. Type Impact
## 3. Frontend Impact & Code
## 4. Documentation (.md)
## 5. Required Commands
