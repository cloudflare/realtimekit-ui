#!/bin/bash

# Multi-library documentation generator
# Usage: ./scripts/docs.sh [library_name] or ./scripts/docs.sh all

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Library configurations (all use core components.d.ts but generate different docs)
get_library_config() {
    case "$1" in
        "core")
            echo "./packages/core/src/components.d.ts ./docs/core core"
            ;;
        "react")
            echo "./packages/core/src/components.d.ts ./docs/react react"
            ;;
        "angular")
            echo "./packages/core/src/components.d.ts ./docs/angular angular"
            ;;
        *)
            echo ""
            ;;
    esac
}

get_all_libraries() {
    echo "core react angular"
}

echo -e "${BLUE}🚀 Multi-Library Documentation Generator${NC}"
echo "================================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed${NC}"
    exit 1
fi

generate_docs() {
    local lib_name=$1
    local input_file=$2
    local output_dir=$3
    local framework=$4
    
    echo -e "${YELLOW}📚 Processing $lib_name...${NC}"
    echo -e "${YELLOW}📖 Input: $input_file${NC}"
    echo -e "${YELLOW}📁 Output: $output_dir${NC}"
    echo -e "${YELLOW}🎯 Framework: $framework${NC}"
    
    # Check if input file exists
    if [ ! -f "$input_file" ]; then
        echo -e "${RED}❌ Warning: Input file not found: $input_file${NC}"
        return 1
    fi
    
    # Generate documentation with framework parameter
    if node "$(dirname "$0")/generate-stencil-docs.js" "$input_file" "$output_dir" "$framework"; then
        echo -e "${GREEN}✅ $lib_name documentation generated successfully!${NC}"
        return 0
    else
        echo -e "${RED}❌ $lib_name documentation generation failed${NC}"
        return 1
    fi
}

# Parse command line arguments
TARGET="${1:-all}"

if [ "$TARGET" = "all" ]; then
    echo -e "${BLUE}🔄 Generating documentation for all libraries...${NC}"
    echo ""
    
    success_count=0
    total_count=0
    
    for lib_name in $(get_all_libraries); do
        config=$(get_library_config "$lib_name")
        if [ -n "$config" ]; then
            IFS=' ' read -r input_file output_dir framework <<< "$config"
            total_count=$((total_count + 1))
            
            if generate_docs "$lib_name" "$input_file" "$output_dir" "$framework"; then
                success_count=$((success_count + 1))
            fi
            echo ""
        fi
    done
    
    echo "================================================"
    echo -e "${BLUE}📊 Summary: $success_count/$total_count libraries processed successfully${NC}"
    
    if [ $success_count -eq $total_count ]; then
        echo -e "${GREEN}🎉 All documentation generated successfully!${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Some libraries failed to generate documentation${NC}"
        exit 1
    fi
    
else
    config=$(get_library_config "$TARGET")
    if [ -n "$config" ]; then
        IFS=' ' read -r input_file output_dir framework <<< "$config"
        generate_docs "$TARGET" "$input_file" "$output_dir" "$framework"
    else
        echo -e "${RED}❌ Error: Unknown library '$TARGET'${NC}"
        echo -e "${YELLOW}Available libraries: $(get_all_libraries) all${NC}"
        echo -e "${YELLOW}Usage: $0 [library_name|all]${NC}"
        exit 1
    fi
fi
