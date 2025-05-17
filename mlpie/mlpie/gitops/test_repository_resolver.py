"""
Test script for repository resolver.

Run this with:
python -m mlpie.gitops.test_repository_resolver [resource_type] [resource_id]
"""

import sys
import asyncio
import json
import logging
from typing import Dict, Any

from mlpie.db.connection import get_session
from mlpie.gitops.repository_resolver import get_resource_repository_info

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_repository_resolution(resource_type: str, resource_id: str) -> Dict[str, Any]:
    """
    Test repository resolution for a resource.
    
    Args:
        resource_type: Type of resource ("dataset", "pipeline", "environment", "project")
        resource_id: ID of the resource
        
    Returns:
        Repository information
    """
    logger.info(f"Testing repository resolution for {resource_type} {resource_id}")
    
    async for session in get_session():
        try:
            result = await get_resource_repository_info(
                resource_type=resource_type,
                resource_id=resource_id,
                session=session
            )
            
            logger.info(f"Resolution result: {json.dumps(result, indent=2)}")
            return result
        except Exception as e:
            logger.exception("Error testing repository resolution", exc_info=e)
            return {"success": False, "error": str(e)}


async def run_test():
    """Run repository resolver test."""
    if len(sys.argv) < 3:
        print("Usage: python -m mlpie.gitops.test_repository_resolver [resource_type] [resource_id]")
        print("Example: python -m mlpie.gitops.test_repository_resolver dataset 123e4567-e89b-12d3-a456-426614174000")
        sys.exit(1)
        
    resource_type = sys.argv[1]
    resource_id = sys.argv[2]
    
    result = await test_repository_resolution(resource_type, resource_id)
    if result.get("success"):
        repo_info = result.get("repository", {})
        print(f"\nRepository for {resource_type} {resource_id} resolved to:")
        print(f"  URL: {repo_info.get('url')}")
        print(f"  Source: {repo_info.get('source')}")
        print(f"  Path in repo: {repo_info.get('path_in_repo')}")
    else:
        print(f"\nFailed to resolve repository: {result.get('error')}")


if __name__ == "__main__":
    asyncio.run(run_test()) 