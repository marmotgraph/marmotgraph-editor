/*
 * Copyright 2018 - 2021 Swiss Federal Institute of Technology Lausanne (EPFL)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * This open source software code was developed in part or in whole in the
 * Human Brain Project, funded from the European Union's Horizon 2020
 * Framework Programme for Research and Innovation under
 * Specific Grant Agreements No. 720270, No. 785907, and No. 945539
 * (Human Brain Project SGA1, SGA2 and SGA3).
 *
 */

import {faMoon} from '@fortawesome/free-solid-svg-icons/faMoon';
import {faSun} from '@fortawesome/free-solid-svg-icons/faSun';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {observer} from 'mobx-react-lite';
import React from 'react';
import { createUseStyles } from 'react-jss';

import useStores from '../../Hooks/useStores';

const useStyles = createUseStyles({
  container:{
    width: '50px',
    height: '50px',
    lineHeight: '41px',
    color: 'var(--ft-color-normal)',
    background: 'var(--bg-color-ui-contrast2)',
    border: '1px solid var(--border-color-ui-contrast2)',
    borderLeft: 'none',
    textAlign: 'center'
  },
  icon:{
    color:'var(--ft-color-normal)',
    fontSize:'1.5em'
  }
});

const ThemeSwitcher = observer(() => {

  const classes = useStyles();

  const { appStore } = useStores();

  const handleClick = () => {
    // Toggle theme between "default" and "bright"
    const newTheme = appStore.currentTheme.name === 'bright' ? 'default' : 'bright';
    appStore.setTheme(newTheme);
  };

  return (
    <div className={classes.container} onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className={classes.icon}>
        <FontAwesomeIcon icon={appStore.currentTheme.name === 'bright' ? faSun : faMoon} />
      </div>
    </div>
  );
});
ThemeSwitcher.displayName = 'ThemeSwitcher';

export default ThemeSwitcher;