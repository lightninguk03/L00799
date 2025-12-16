"""
Project Neon 测试运行器
一键运行所有测试

运行: python run_tests.py [类型]
类型: all, unit, integration, api, stress
"""
import subprocess
import sys
import os


def run_command(cmd, description):
    """运行命令并显示结果"""
    print(f"\n{'='*60}")
    print(f"🧪 {description}")
    print(f"{'='*60}")
    print(f"命令: {cmd}\n")
    
    result = subprocess.run(cmd, shell=True)
    return result.returncode == 0


def check_dependencies():
    """检查测试依赖"""
    deps = ["pytest", "requests", "locust"]
    missing = []
    
    for dep in deps:
        try:
            __import__(dep)
        except ImportError:
            missing.append(dep)
    
    if missing:
        print(f"⚠️  缺少依赖: {', '.join(missing)}")
        print(f"安装: pip install {' '.join(missing)}")
        return False
    return True


def main():
    test_type = sys.argv[1] if len(sys.argv) > 1 else "all"
    
    print("="*60)
    print("🚀 Project Neon 测试运行器")
    print("="*60)
    
    if not check_dependencies():
        print("\n请先安装缺少的依赖")
        return
    
    results = {}
    
    if test_type in ["all", "unit"]:
        results["单元测试"] = run_command(
            "pytest tests/test_unit.py -v --tb=short",
            "单元测试 (pytest)"
        )

    if test_type in ["all", "integration"]:
        results["集成测试"] = run_command(
            "pytest tests/test_integration.py -v --tb=short",
            "集成测试 (pytest + 数据库)"
        )
    
    if test_type in ["all", "api"]:
        results["接口测试"] = run_command(
            "python test_full.py",
            "接口测试 (requests)"
        )
    
    if test_type == "stress":
        print("\n" + "="*60)
        print("🧪 压力测试 (locust)")
        print("="*60)
        print("启动 Locust Web UI...")
        print("访问 http://localhost:8089 配置并发数")
        print("按 Ctrl+C 停止")
        os.system("locust -f tests/test_stress.py --host=http://localhost:8000")
        return
    
    # 汇总结果
    print("\n" + "="*60)
    print("📊 测试结果汇总")
    print("="*60)
    
    all_passed = True
    for name, passed in results.items():
        status = "✅ 通过" if passed else "❌ 失败"
        print(f"  {name}: {status}")
        if not passed:
            all_passed = False
    
    print()
    if all_passed:
        print("🎉 所有测试通过!")
    else:
        print("⚠️  部分测试失败，请检查上方输出")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ["--help", "-h"]:
        print(__doc__)
    else:
        main()
