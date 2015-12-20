<?php
/**
 * Lang
 * ==========
 * This class is used for inserting language strings in the UI.
 * If the requested string is not present, it tries to fall back into the default language.
 * If the string is not present there, the key is returned.
 *
 * @author: Christian Engel <hello@wearekiss.com>
 * @version: 3 17.11.14
 */

namespace Kiss;

class Lang
{
    private $langKey = 'en';
    private static $langDefault = 'en';
    private $viewName = '';
    private $basePath;

    function __construct($basePath = 'lib/lang/')
    {
        $this->basePath = $basePath;
    }

    public function setLang($lang_name)
    {
        $this->langKey = $lang_name;
    }

    public function setView($viewName)
    {
        $this->viewName = $viewName;
    }

    /**
     * Tries to get a specific string from the language repository.
     * When you have set to a specific view before, you can simply fetch values like this:
     * "my_object.my_key", or directly "my_key".
     *
     * If you want to recieve something from a specific view, call "viewname:my_key".
     *
     * @param {string} $key The string selector.
     * @param array $data
     * @throws \ErrorException
     * @return mixed|string
     */
    function get($key, $data = array())
    {
        //Look if it targets a specific view.
        $p = explode(':', $key);
        if (count($p) == 2) {
            //view has been selected
            $viewName = $p[0];
            $key = $p[1];
        } else {
            $key = $p[0];
            $viewName = $this->viewName;
        }
        $p = explode('.', $key);

        $result = '';

        if (file_exists($this->basePath . $this->langKey . '/' . $viewName . '.json')) {
            $file = $this->basePath . $this->langKey . '/' . $viewName . '.json';
        } else {
            if (file_exists($this->basePath . self::$langDefault . '/' . $viewName . '.json')) {
                $file = $this->basePath . self::$langDefault . '/' . $viewName . '.json';
            } else {
                return '[View not found]';
            }
        }


        $scope = json_decode(file_get_contents($file), TRUE);
        if ($scope == NULL) {
            throw new \ErrorException('Language file not readable or broken (' . $file . ')');
        }

        while (count($p)) {
            $part = array_shift($p);
            if (!isset($scope[$part])) {
                return '[Key not found]';
                break;
            }
            if (is_string($scope[$part])) {
                $result = $scope[$part];
                break;
            }
            $scope = $scope[$part];
        }

        if (!$result) {
            $result = $scope;
        }

        foreach ($data as $k => $v) {
            $result = str_replace('{{' . $k . '}}', $v, $result);
        }

        return $result;
    }

    /**
     * Fetches the full language file as an Array.
     * @return mixed|null
     * @throws \ErrorException
     */
    function getJSON()
    {
        $viewName = $this->viewName;

        if (file_exists($this->basePath . $this->langKey . '/' . $viewName . '.json')) {
            $file = $this->basePath . $this->langKey . '/' . $viewName . '.json';
        } else {
            if (file_exists($this->basePath . $this->langDefault . '/' . $viewName . '.json')) {
                $file = $this->basePath . $this->langDefault . '/' . $viewName . '.json';
            } else {
                return NULL;
            }
        }

        $dta = json_decode(file_get_contents($file), TRUE);

        if ($dta == NULL) {
            throw new \ErrorException('Language file not readable (' . $file . ')');
        }

        return $dta;
    }

    /**
     * Replaces all placeholders with actual data.
     * @param {String} $inputString The string containing all placeholders to be replaced.
     * @param {Array} [$fillData] Some additional data to replace placeholders inside lang strings with.
     * @return mixed
     */
    function fillPlaceholders($inputString, $fillData = array())
    {
        preg_match_all('#\{\{ (.+?) \}\}#', $inputString, $matches);

        foreach ($matches[1] as $v) {
            $inputString = str_replace('{{ ' . $v . ' }}', $this->get($v, $fillData), $inputString);
        }

        return $inputString;
    }

    /**
     * Fetches the desired language of the visitor by analyzing his request headers.
     * @return string {String} Two character representation of the language.
     */
    function determine()
    {
        if (!isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
            return 'en';
        }

        $langs = $_SERVER['HTTP_ACCEPT_LANGUAGE'];
        $langs = explode(',', $langs);

        foreach ($langs as $v) {
            if (strlen($v) == 5) {
                $v = explode('-', $v);
                $v = $v[0];
            }

            if (strlen($v) == 2) {
                if (file_exists($this->basePath . $v)) {
                    return $v;
                }
            }
        }

        return self::$langDefault;
    }

    static function determineStatic($existingLanguages = NULL, $fallbackLanguage = 'en')
    {
        if (!isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
            return $fallbackLanguage;
        }

        $langs = $_SERVER['HTTP_ACCEPT_LANGUAGE'];
        $langs = explode(',', $langs);

        foreach ($langs as $v) {
            if (strlen($v) == 5) {
                $v = explode('-', $v);
                $v = $v[0];
            }

            if (strlen($v) == 2) {
                if ($existingLanguages) {
                    if (in_array($v, $existingLanguages)) {
                        return $v;
                    }
                } else {
                    if (file_exists('lib/lang/' . $v)) {
                        return $v;
                    }
                }
            }
        }

        return $fallbackLanguage;
    }
}
