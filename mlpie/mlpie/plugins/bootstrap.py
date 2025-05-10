"""
Plugin Bootstrapping for MLPie.

This module handles the discovery and registration of all plugins
during application startup.
"""
import logging
from typing import List

from mlpie.plugins.discovery import discover_external_plugins, discover_built_in_plugins
from mlpie.plugins.base import Plugin # For type hinting if needed

logger = logging.getLogger(__name__)

async def initialize_plugins():
    """
    Discovers and registers all plugins for the application.
    This function should be called once at application startup.
    """
    logger.info("===== Discovering ALL plugins =====")
    
    logger.info("Discovering external plugins from entry points...")
    external_plugins = discover_external_plugins()
    logger.info(f"Discovered {len(external_plugins)} external plugins.")
    
    # Discover built-in plugins from specified MLPie modules
    logger.info("Discovering MLPie internal module providers (including secrets, profilers, etc.)...")
    
    built_in_plugins = discover_built_in_plugins()
    logger.info(f"Discovered {len(built_in_plugins)} plugins from MLPie internal modules.")

    total_discovered = len(external_plugins) + len(built_in_plugins)
    logger.info(f"Total plugins discovered and processed by registry: {total_discovered}")

    # The plugin_registry (singleton) is populated by the discovery functions directly.
    # No explicit return of plugin list is needed here unless for direct inspection,
    # as the registry itself holds the state.

# Example of how to potentially get all registered plugins if needed elsewhere,
# though typically other parts of the system will use plugin_registry.get_plugin() etc.
# from mlpie.plugins.registry import plugin_registry
# from mlpie.plugins.base import PluginType
#
# def get_all_registered_plugins_summary():
#     all_plugins_map = {}
#     for pt_enum in PluginType:
#         try:
#             all_plugins_map[pt_enum.value] = list(plugin_registry.get_plugin_classes(pt_enum).keys())
#         except Exception:
#             all_plugins_map[pt_enum.value] = []
#     return all_plugins_map 