<?php
/**
 * RestError
 * =========
 * Custom Error object for the REST interface.
 * This means a API error has happened instead of a hard system error.
 */

namespace CMS\REST;

class RestError extends \ErrorException{
	var $data = NULL;

	function __construct($message = '', $code = 0, $data = NULL, $severity = 1, $filename = __FILE__, $lineno = __LINE__, $previous = NULL){
		parent::__construct($message, $code, $severity, $filename, $lineno, $previous);
		$this->data = $data;
	}
}
