; ModuleID = 'probe6.e167d3b24b8af7a2-cgu.0'
source_filename = "probe6.e167d3b24b8af7a2-cgu.0"
target datalayout = "e-m:e-p:32:32-p10:8:8-p20:8:8-i64:64-n32:64-S128-ni:1:10:20"
target triple = "wasm32-unknown-unknown"

; core::num::<impl u32>::to_ne_bytes
; Function Attrs: inlinehint nounwind
define internal i32 @"_ZN4core3num21_$LT$impl$u20$u32$GT$11to_ne_bytes17h4c0fa9d3b6f4454cE"(i32 %self) unnamed_addr #0 {
start:
  %_0 = alloca [4 x i8], align 1
  store i32 %self, ptr %_0, align 1
  %0 = load i32, ptr %_0, align 1
  ret i32 %0
}

; probe6::probe
; Function Attrs: nounwind
define hidden void @_ZN6probe65probe17h934650beea2aa9c6E() unnamed_addr #1 {
start:
  %0 = alloca i32, align 4
  %_1 = alloca [4 x i8], align 1
; call core::num::<impl u32>::to_ne_bytes
  %1 = call i32 @"_ZN4core3num21_$LT$impl$u20$u32$GT$11to_ne_bytes17h4c0fa9d3b6f4454cE"(i32 1) #3
  store i32 %1, ptr %0, align 4
  call void @llvm.memcpy.p0.p0.i32(ptr align 1 %_1, ptr align 4 %0, i32 4, i1 false)
  ret void
}

; Function Attrs: nocallback nofree nounwind willreturn memory(argmem: readwrite)
declare void @llvm.memcpy.p0.p0.i32(ptr noalias nocapture writeonly, ptr noalias nocapture readonly, i32, i1 immarg) #2

attributes #0 = { inlinehint nounwind "target-cpu"="generic" }
attributes #1 = { nounwind "target-cpu"="generic" }
attributes #2 = { nocallback nofree nounwind willreturn memory(argmem: readwrite) }
attributes #3 = { nounwind }

!llvm.ident = !{!0}

!0 = !{!"rustc version 1.76.0 (07dca489a 2024-02-04)"}
