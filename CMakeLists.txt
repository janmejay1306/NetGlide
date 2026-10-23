cmake_minimum_required(VERSION 3.21)

# Select configurations before project()
set(CMAKE_CONFIGURATION_TYPES Debug Release CACHE STRING "Supported configurations" FORCE)

project(NetGlideCEF)

# Use folders in IDE
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

# CEF root setup
set(CEF_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/cef")
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CEF_ROOT}/cmake")

# Load CEF configuration (sets all CEF_* variables and macros)
find_package(CEF REQUIRED)

# Create the libcef import target
ADD_LOGICAL_TARGET("libcef_lib" "${CEF_LIB_DEBUG}" "${CEF_LIB_RELEASE}")

# Determine the target output directory
SET_CEF_TARGET_OUT_DIR()

# Include the libcef_dll_wrapper target
add_subdirectory(${CEF_LIBCEF_DLL_WRAPPER_PATH} libcef_dll_wrapper)

# NetGlideCEF executable target (no sandbox)
set(NETGLIDE_SRCS src-cef/main.cpp)

add_executable(NetGlideCEF WIN32 ${NETGLIDE_SRCS})

# Apply proper CEF compile/link flags via official macro
SET_EXECUTABLE_TARGET_PROPERTIES(NetGlideCEF)

add_dependencies(NetGlideCEF libcef_dll_wrapper)
target_link_libraries(NetGlideCEF libcef_lib libcef_dll_wrapper ${CEF_STANDARD_LIBS})

# Copy binary and resource files to the target output directory
COPY_FILES("NetGlideCEF" "${CEF_BINARY_FILES}" "${CEF_BINARY_DIR}" "${CEF_TARGET_OUT_DIR}")
COPY_FILES("NetGlideCEF" "${CEF_RESOURCE_FILES}" "${CEF_RESOURCE_DIR}" "${CEF_TARGET_OUT_DIR}")

# Display configuration
PRINT_CEF_CONFIG()
