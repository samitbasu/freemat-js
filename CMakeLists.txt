cmake_minimum_required(VERSION 2.8)

project(mat)

add_library(mat SHARED addon_source/mat.cpp addon_source/LAPACK.cpp)

include_directories(addon_source)

if (APPLE)
find_library(BLAS_LIB NAMES Accelerate) 
find_path(BLAS_PATH NAMES accelerate.h)  
endif()

if (NOT APPLE)
  find_library(BLAS_LIB NAMES openblas)
  find_library(LAPACK_LIB NAMES lapack)
  find_path(BLAS_PATH NAMES cblas.h PATHS /usr/include/openblas DOC "Location of cblas.h")
endif()

set_target_properties(mat PROPERTIES PREFIX "" SUFFIX ".node")

target_include_directories(mat PRIVATE ${CMAKE_JS_INC} ${BLAS_PATH})

target_link_libraries(mat ${CMAKE_JS_LIB} ${BLAS_LIB} ${LAPACK_LIB})
