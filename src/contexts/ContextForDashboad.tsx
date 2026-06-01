import React from 'react'
import { createContext, useEffect, useState } from "react";


type SaralUser = { 
  id : number,
  lastlogin : string,
  role : string,
  saralemail : string,
  school_id : number
}

type SaralSchool = {
  id : number,
  name : string,
  email : string,
  shortName : string,
  status : string,
  city : string,
  state : string,
}

export const ContextForDashBord = createContext<{USER : SaralUser , SCHOOL : SaralSchool} | null>(null);

export function ProviderForDashboad() {

  const [user, setUser] = useState<SaralUser | null>(null);
  const [school, setSchool] = useState<SaralSchool | null>(null);

  return (
    <ContextForDashBord.Provider value={null}>
      <div>
        <h1>Provider</h1>
      </div>
    </ContextForDashBord.Provider>
  )
}
