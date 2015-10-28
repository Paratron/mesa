<?php

/**
 * ModuleManager
 * =============
 * This class is responsible for loading modules and propagating events to the different modules to
 * give them the possibility to react on them.
 *
 * @author: Christian Engel <hello@wearekiss.com>
 * @version: 1 01/10/2015
 */

namespace CMS;

class ModuleManager
{
	var $events = array();

	/**
	 * Pass an array of module names to this function to load and initialize them.
	 * Usually called by the bootstrap file.
	 * @param $modules
	 */
	function fetch($modules){
		foreach($modules as $m){
			require 'php/Modules/' . $m . '/init.php';
		}
	}

	/**
	 * This method is used by the modules to register module functions to certain events that may
	 * occur in the system.
	 * @param string $eventName
	 * @param callable $callable
	 */
	function register($eventName, $callable){
		if(!isset($this->events[$eventName])){
			$this->events[$eventName] = array();
		}

		$this->events[$eventName][] = $callable;
	}

	/**
	 * This method may be called from anywhere - within the system, even within other modules.
	 * It triggers an event and passes it to all modules who have registered for the event.
	 * The $data property is passed through all the registered event methods and the final result will
	 * be returned by the function.
	 *
	 * @param string $eventName
	 * @param null $data
	 * @return mixed|null
	 */
	function trigger($eventName, $data=NULL){
		if(!isset($this->events[$eventName])){
			return $data;
		}

		foreach($this->events[$eventName] as $callable){
			$data = call_user_func($callable, array($data));
		}

		return $data;
	}
}
